import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import axios from 'axios';
import './App.css';

const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
          >
            <span className="toast-icon">
              {toast.type === 'success' ? '✓' : '✕'}
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  return useContext(ToastContext);
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://minichain-gp90.onrender.com';

const api = {
  getStatus: () => axios.get(`${API_BASE}/api/status`),
  init: (data) => axios.post(`${API_BASE}/api/init`, data),
  newAccount: (data) => axios.post(`${API_BASE}/api/account/new`, data),
  getBalance: (data) => axios.post(`${API_BASE}/api/account/balance`, data),
  getAccountInfo: (data) => axios.post(`${API_BASE}/api/account/info`, data),
  listAccounts: (data) => axios.post(`${API_BASE}/api/account/list`, data),
  mintTokens: (data) => axios.post(`${API_BASE}/api/account/mint`, data),
  sendTx: (data) => axios.post(`${API_BASE}/api/tx/send`, data),
  listMempool: (data) => axios.post(`${API_BASE}/api/tx/list`, data),
  clearMempool: (data) => axios.post(`${API_BASE}/api/tx/clear`, data),
  listBlocks: (data) => axios.post(`${API_BASE}/api/block/list`, data),
  getBlockInfo: (data) => axios.post(`${API_BASE}/api/block/info`, data),
  produceBlock: (data) => axios.post(`${API_BASE}/api/block/produce`, data),
  deployContract: (data) => axios.post(`${API_BASE}/api/contract/deploy`, data),
  callContract: (data) => axios.post(`${API_BASE}/api/contract/call`, data),
};

function App() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await api.getStatus();
      setStatus(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <ToastProvider>
      <div className="app">
        <header className="header">
          <h1>Minichain Dashboard</h1>
          <nav>
            <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
            <button className={activeTab === 'accounts' ? 'active' : ''} onClick={() => setActiveTab('accounts')}>Accounts</button>
            <button className={activeTab === 'transactions' ? 'active' : ''} onClick={() => setActiveTab('transactions')}>Transactions</button>
            <button className={activeTab === 'blocks' ? 'active' : ''} onClick={() => setActiveTab('blocks')}>Blocks</button>
            <button className={activeTab === 'contracts' ? 'active' : ''} onClick={() => setActiveTab('contracts')}>Contracts</button>
          </nav>
        </header>

        <main className="main">
          {!status?.initialized && <InitBlockchain onInitialized={loadStatus} />}
          
          {activeTab === 'dashboard' && <Dashboard status={status} onRefresh={loadStatus} />}
          {activeTab === 'accounts' && <Accounts />}
          {activeTab === 'transactions' && <Transactions />}
          {activeTab === 'blocks' && <Blocks />}
          {activeTab === 'contracts' && <Contracts />}
        </main>
      </div>
    </ToastProvider>
  );
}

function InitBlockchain({ onInitialized }) {
  const [authorities, setAuthorities] = useState(1);
  const [blockTime, setBlockTime] = useState(5);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleInit = async () => {
    setLoading(true);
    try {
      const res = await api.init({ authorities, block_time: blockTime });
      if (res.data.success) {
        addToast('Blockchain initialized successfully!', 'success');
        onInitialized();
      } else {
        addToast(res.data.error, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card init-card">
      <h2>Initialize Blockchain</h2>
      <p>The blockchain is not initialized yet. Set up your network parameters below.</p>
      
      <div className="form-group">
        <label>Number of Authorities:</label>
        <input 
          type="number" 
          value={authorities} 
          onChange={(e) => setAuthorities(parseInt(e.target.value))}
          min={1}
          max={10}
        />
      </div>
      
      <div className="form-group">
        <label>Block Time (seconds):</label>
        <input 
          type="number" 
          value={blockTime} 
          onChange={(e) => setBlockTime(parseInt(e.target.value))}
          min={1}
          max={60}
        />
      </div>
      
      <button onClick={handleInit} disabled={loading}>
        {loading ? 'Initializing...' : 'Initialize Blockchain'}
      </button>
    </div>
  );
}

function Dashboard({ status, onRefresh }) {
  const [blocks, setBlocks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [mempool, setMempool] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [blocksRes, accountsRes, mempoolRes] = await Promise.all([
        api.listBlocks({ count: 5 }),
        api.listAccounts({}),
        api.listMempool({}),
      ]);
      setBlocks(blocksRes.data.data || []);
      setAccounts(accountsRes.data.data || []);
      setMempool(mempoolRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Chain Height</h3>
          <p className="stat-value">{status?.height || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Genesis Hash</h3>
          <p className="stat-value small">{status?.genesis_hash?.slice(0, 16) || 'N/A'}...</p>
        </div>
        <div className="stat-card">
          <h3>Authorities</h3>
          <p className="stat-value">{status?.authorities?.length || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Txs</h3>
          <p className="stat-value">{mempool.length}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Recent Blocks</h3>
          {loading ? <p>Loading...</p> : (
            <div className="list">
              {blocks.map(block => (
                <div key={block.hash} className="list-item">
                  <span className="block-height">#{block.height}</span>
                  <span className="block-hash">{block.hash.slice(0, 12)}...</span>
                  <span className="block-txs">{block.transactions.length} txs</span>
                </div>
              ))}
              {blocks.length === 0 && <p>No blocks yet</p>}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Accounts</h3>
          {loading ? <p>Loading...</p> : (
            <div className="list">
              {accounts.map(account => (
                <div key={account.address} className="list-item">
                  <span className="account-name">{account.name}</span>
                  <span className="account-address">{account.address.slice(0, 12)}...</span>
                </div>
              ))}
              {accounts.length === 0 && <p>No accounts yet</p>}
            </div>
          )}
        </div>
      </div>

      <button onClick={loadData} className="refresh-btn">Refresh</button>
    </div>
  );
}

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);
  
  const [newName, setNewName] = useState('');
  const [balanceAddress, setBalanceAddress] = useState('');
  const [balance, setBalance] = useState(null);
  const [mintFrom, setMintFrom] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.listAccounts({});
      setAccounts(res.data.data || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const res = await api.newAccount({ name: newName || null });
      if (res.data.success) {
        setNewName('');
        addToast('Account created successfully!', 'success');
        loadAccounts();
      } else {
        addToast(res.data.error, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleGetBalance = async () => {
    try {
      const res = await api.getBalance({ address: balanceAddress });
      if (res.data.success) {
        setBalance(res.data.data);
      } else {
        addToast(res.data.error, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleGetInfo = async (address) => {
    setSelectedAccount(address);
    try {
      const res = await api.getAccountInfo({ address });
      if (res.data.success) {
        setAccountInfo(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMint = async () => {
    try {
      const res = await api.mintTokens({ from: mintFrom, to: mintTo, amount: parseInt(mintAmount) });
      if (res.data.success) {
        setMintAmount('');
        addToast(`Minted tokens to ${mintTo}`, 'success');
      } else {
        addToast(res.data.error, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="accounts-page">
      <div className="card">
        <h3>Create New Account</h3>
        <div className="form-group">
          <label>Account Name (optional):</label>
          <input 
            type="text" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)}
            placeholder="myaccount"
          />
        </div>
        <button onClick={handleCreateAccount}>Create Account</button>
      </div>

      <div className="card">
        <h3>Check Balance</h3>
        <div className="form-group">
          <label>Address:</label>
          <input 
            type="text" 
            value={balanceAddress} 
            onChange={(e) => setBalanceAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <button onClick={handleGetBalance}>Get Balance</button>
        {balance !== null && <div className="result">Balance: {balance}</div>}
      </div>

      <div className="card">
        <h3>Mint Tokens (Authority Only)</h3>
        <div className="form-group">
          <label>From Authority:</label>
          <select value={mintFrom} onChange={(e) => setMintFrom(e.target.value)}>
            <option value="">Select authority...</option>
            {accounts.filter(a => a.name.startsWith('authority')).map(a => (
              <option key={a.address} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>To Address:</label>
          <input 
            type="text" 
            value={mintTo} 
            onChange={(e) => setMintTo(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>Amount:</label>
          <input 
            type="number" 
            value={mintAmount} 
            onChange={(e) => setMintAmount(e.target.value)}
          />
        </div>
        <button onClick={handleMint} disabled={!mintFrom || !mintTo}>Mint</button>
      </div>

      <div className="card full-width">
        <h3>All Accounts</h3>
        {loading ? <p>Loading...</p> : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(account => (
                <tr key={account.address}>
                  <td>{account.name}</td>
                  <td className="address">{account.address}</td>
                  <td>
                    <button onClick={() => handleGetInfo(account.address)}>Info</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {accountInfo && (
        <div className="modal" onClick={() => setAccountInfo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Account Info</h3>
            <p><strong>Address:</strong> {accountInfo.address}</p>
            <p><strong>Balance:</strong> {accountInfo.balance}</p>
            <p><strong>Nonce:</strong> {accountInfo.nonce}</p>
            <p><strong>Is Contract:</strong> {accountInfo.is_contract ? 'Yes' : 'No'}</p>
            {accountInfo.code_hash && <p><strong>Code Hash:</strong> {accountInfo.code_hash}</p>}
            <button onClick={() => setAccountInfo(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Transactions() {
  const [mempool, setMempool] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [fromAccount, setFromAccount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [accounts, setAccounts] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    loadMempool();
    loadAccounts();
  }, []);

  const loadMempool = async () => {
    setLoading(true);
    try {
      const res = await api.listMempool({});
      setMempool(res.data.data || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await api.listAccounts({});
      setAccounts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    try {
      const res = await api.sendTx({
        from: fromAccount,
        to: toAddress,
        amount: parseInt(amount),
      });
      if (res.data.success) {
        addToast(`Transaction sent! Hash: ${res.data.data.slice(0, 16)}...`, 'success');
        loadMempool();
      } else {
        addToast(res.data.error, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleClearMempool = async () => {
    try {
      const res = await api.clearMempool({});
      if (res.data.success) {
        addToast('Mempool cleared successfully!', 'success');
        loadMempool();
      } else {
        addToast(res.data.error, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="transactions-page">
      <div className="card">
        <h3>Send Transaction</h3>
        <div className="form-group">
          <label>From Account:</label>
          <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)}>
            <option value="">Select account...</option>
            {accounts.map(a => (
              <option key={a.address} value={a.name}>{a.name} ({a.address.slice(0, 8)}...)</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>To Address:</label>
          <input 
            type="text" 
            value={toAddress} 
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>Amount:</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button onClick={handleSend} disabled={!fromAccount || !toAddress || !amount}>
          Send Transaction
        </button>
      </div>

      <div className="card">
        <h3>Mempool ({mempool.length} pending)</h3>
        <button onClick={handleClearMempool} className="secondary">Clear Mempool</button>
        
        {loading ? <p>Loading...</p> : (
          <div className="list">
            {mempool.map(tx => (
              <div key={tx.hash} className="list-item tx-item">
                <div><strong>Hash:</strong> {tx.hash.slice(0, 16)}...</div>
                <div><strong>From:</strong> {tx.from.slice(0, 12)}...</div>
                <div><strong>To:</strong> {tx.to?.slice(0, 12)}...</div>
                <div><strong>Value:</strong> {tx.value}</div>
                <div><strong>Nonce:</strong> {tx.nonce}</div>
              </div>
            ))}
            {mempool.length === 0 && <p>No pending transactions</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function Blocks() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockInfo, setBlockInfo] = useState(null);
  const [count, setCount] = useState(10);
  
  const [authority, setAuthority] = useState('');
  const [accounts, setAccounts] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    loadBlocks();
    loadAccounts();
  }, []);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const res = await api.listBlocks({ count });
      setBlocks(res.data.data || []);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const res = await api.listAccounts({});
      setAccounts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockClick = async (blockId) => {
    try {
      const res = await api.getBlockInfo({ block_id: blockId });
      if (res.data.success) {
        setSelectedBlock(blockId);
        setBlockInfo(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProduceBlock = async () => {
    try {
      const res = await api.produceBlock({ authority });
      if (res.data.success) {
        addToast(`Block produced successfully! Hash: ${res.data.data.slice(0, 16)}...`, 'success');
        loadBlocks();
      } else {
        addToast(res.data.error, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="blocks-page">
      <div className="card">
        <h3>Produce Block (Authority Only)</h3>
        <div className="form-group">
          <label>Authority:</label>
          <select value={authority} onChange={(e) => setAuthority(e.target.value)}>
            <option value="">Select authority...</option>
            {accounts.filter(a => a.name.startsWith('authority')).map(a => (
              <option key={a.address} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <button onClick={handleProduceBlock} disabled={!authority}>Produce Block</button>
      </div>

      <div className="card">
        <h3>Recent Blocks</h3>
        <div className="form-group">
          <label>Number of blocks:</label>
          <input 
            type="number" 
            value={count} 
            onChange={(e) => setCount(parseInt(e.target.value))}
            min={1}
            max={100}
          />
        </div>
        <button onClick={loadBlocks}>Refresh</button>
        
        {loading ? <p>Loading...</p> : (
          <div className="list">
            {blocks.map(block => (
              <div 
                key={block.hash} 
                className="list-item block-item"
                onClick={() => handleBlockClick(block.height.toString())}
              >
                <span className="block-height">#{block.height}</span>
                <span className="block-hash">{block.hash.slice(0, 20)}...</span>
                <span className="block-txs">{block.transactions.length} txs</span>
              </div>
            ))}
            {blocks.length === 0 && <p>No blocks yet</p>}
          </div>
        )}
      </div>

      {blockInfo && (
        <div className="modal" onClick={() => setBlockInfo(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Block #{blockInfo.height}</h3>
            <p><strong>Hash:</strong> {blockInfo.hash}</p>
            <p><strong>Parent Hash:</strong> {blockInfo.parent_hash.slice(0, 20)}...</p>
            <p><strong>State Root:</strong> {blockInfo.state_root.slice(0, 20)}...</p>
            <p><strong>Timestamp:</strong> {blockInfo.timestamp}</p>
            <p><strong>Transactions:</strong> {blockInfo.transactions.length}</p>
            <div className="tx-list">
              {blockInfo.transactions.map((tx, i) => (
                <div key={i} className="tx-hash">{tx.slice(0, 20)}...</div>
              ))}
            </div>
            <button onClick={() => setBlockInfo(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Contracts() {
  const [deployFrom, setDeployFrom] = useState('');
  const [deploySource, setDeploySource] = useState('');
  const [deployGasLimit, setDeployGasLimit] = useState(100000);
  
  const [callFrom, setCallFrom] = useState('');
  const [callTo, setCallTo] = useState('');
  const [callData, setCallData] = useState('');
  const [callAmount, setCallAmount] = useState(0);
  
  const [accounts, setAccounts] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await api.listAccounts({});
      setAccounts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeploy = async () => {
    try {
      const res = await api.deployContract({
        from: deployFrom,
        source: deploySource,
        gas_limit: parseInt(deployGasLimit),
      });
      if (res.data.success) {
        addToast(`Contract deployed! Hash: ${res.data.data.slice(0, 16)}...`, 'success');
      } else {
        addToast(res.data.error, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCall = async () => {
    try {
      const res = await api.callContract({
        from: callFrom,
        to: callTo,
        data: callData || null,
        amount: parseInt(callAmount),
      });
      if (res.data.success) {
        addToast(`Contract called! Hash: ${res.data.data.slice(0, 16)}...`, 'success');
      } else {
        addToast(res.data.error, 'error');
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="contracts-page">
      <div className="card">
        <h3>Deploy Contract</h3>
        <div className="form-group">
          <label>From Account:</label>
          <select value={deployFrom} onChange={(e) => setDeployFrom(e.target.value)}>
            <option value="">Select account...</option>
            {accounts.map(a => (
              <option key={a.address} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Contract Source Path:</label>
          <input 
            type="text" 
            value={deploySource} 
            onChange={(e) => setDeploySource(e.target.value)}
            placeholder="./contracts/counter.asm"
          />
        </div>
        <div className="form-group">
          <label>Gas Limit:</label>
          <input 
            type="number" 
            value={deployGasLimit} 
            onChange={(e) => setDeployGasLimit(e.target.value)}
          />
        </div>
        <button onClick={handleDeploy} disabled={!deployFrom || !deploySource}>Deploy</button>
      </div>

      <div className="card">
        <h3>Call Contract</h3>
        <div className="form-group">
          <label>From Account:</label>
          <select value={callFrom} onChange={(e) => setCallFrom(e.target.value)}>
            <option value="">Select account...</option>
            {accounts.map(a => (
              <option key={a.address} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Contract Address:</label>
          <input 
            type="text" 
            value={callTo} 
            onChange={(e) => setCallTo(e.target.value)}
            placeholder="0x..."
          />
        </div>
        <div className="form-group">
          <label>Calldata (hex):</label>
          <input 
            type="text" 
            value={callData} 
            onChange={(e) => setCallData(e.target.value)}
            placeholder="..."
          />
        </div>
        <div className="form-group">
          <label>Amount:</label>
          <input 
            type="number" 
            value={callAmount} 
            onChange={(e) => setCallAmount(e.target.value)}
          />
        </div>
        <button onClick={handleCall} disabled={!callFrom || !callTo}>Call</button>
      </div>
    </div>
  );
}

export default App;
