import React, { useState, useEffect, useContext, useRef } from 'react';
// import './trade.css'
import withAuth from '../ProtectionHOCs/withAuth';
import "./on-board.css"
import { useDispatch, useSelector } from 'react-redux';
import { clearKeys, connectExchanger, disconnectExchanger, handleApiKeyChanges, startBot as controlBot, stopBot as handleStopBot } from '../../redux/slice/userSlice';
import { StateContext } from './StateContext';
import axios from 'axios';

function Trade() {
  const dispatch = useDispatch();

  const [accountInfo, setAccountInfo] = useState(null);
  const [isManuallyTriggered, setIsManuallyTriggered] = useState(false)
  const [apiKey, setApiKey] = useState('');
  const [apiSecretKey, setApiSecretKey] = useState('');
  const [exchangeType, setExchangeType] = useState('binanceFuturesTestnet');
  const [tradeDecision, setTradeDecision] = useState(null);
  const [error, setError] = useState([]);
  const [tradingPairs, setTradingPairs] = useState([]);
  const [tradingManual, setTradingManual] = useState("smart");
  const [orderType, setOrderType] = useState('market');
  const [selectedPair, setSelectedPair] = useState('');
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [orderTypes, setOrderTypes] = useState(['market', 'limit', 'trailing']);
  const [tradeResult, setTradeResult] = useState(null);
  const [tradeResultVisible, setTradeResultVisible] = useState(false);
  const [symbol, setSymbol] = useState('');
  const isConnected = useSelector((state) => state.user.connected);
  const isBotRunning = useSelector((state) => state.user.botRunning);
  const accId = useSelector((state) => state.user.accountId);
  const apiSecKey = useSelector((state) => state.user.apiSecretKey);
  const api_Key = useSelector((state) => state.user.apiKey);
  const {userEmail} = useSelector(({user})=>({
    userEmail:user?.user?.email
  }))
  const { state, setState } = useContext(StateContext);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  const [openOrders, setOpenOrders] = useState([]);
  const [openPositions, setOpenPositions] = useState([]);
  const [closingOrderIds, setClosingOrderIds] = useState([]); // Track loading state for each order
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPairs, setFilteredPairs] = useState(tradingPairs);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);


  const handleClearKeys = (e) => {
    e.preventDefault();
    dispatch(clearKeys());
  }

  const getBaseUrl = () => {
    if (exchangeType === 'binanceFuturesTestnet') return 'https://testnet.binancefuture.com';
    if (exchangeType === 'binanceFutures') return 'https://fapi.binance.com';
    if (exchangeType === 'binanceSpot') return 'https://api.binance.com';
    return '';
  };

  const runSmartBot = async () => {
  try {
    await fetchTopPairsFromBackend();
    await fetchBestScoringPair();
  } catch (err) {
    console.error("Error in Smart Bot execution:", err);
  }
};

const fetchTopPairsFromBackend = async () => {
  try {
    const response = await fetch('http://localhost:8001/api/top-pairs', {
      headers: {
        'X-EXCHANGE-TYPE': exchangeType || 'binancefutures'  // Default fallback
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch top pairs. Status: ${response.status}`);
    }

    const data = await response.json();

    // Optional: Destructure with default empty arrays
    const {
      topVolatilePairs = [],
      topGainerPairs = [],
      topVolumePairs = []
    } = data;
     const selected = topVolatilePairs?.[0];

    console.log("🔥 Top Volatile Pairs:", topVolatilePairs);
    console.log("📈 Top Gainer Pairs:", topGainerPairs);
    console.log("💰 Top Volume Pairs:", topVolumePairs);

    return {
      topVolatilePairs,
      topGainerPairs,
      topVolumePairs
    };

  } catch (error) {
    console.error("❌ Error fetching top pairs from backend:", error.message);

    return {
      topVolatilePairs: [],
      topGainerPairs: [],
      topVolumePairs: []
    };
  }
};

 const fetchBestScoringPair = async () => {
  try {
    const response = await fetch('http://localhost:8001/api/best-pair', {
      headers: { 'X-EXCHANGE-TYPE': exchangeType || 'binancefutures' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch best pair. Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.pair) {
      setState(prev => ({
        ...prev,
        selectedPair: data.pair,
        symbol: data.pair,
        strategyScore: data.score,
        strategySignal: data.signal,
        bestPairMessage: `✅ Selected: ${data.pair} | Signal: ${data.signal} | Score: ${data.score}`,
      }));
      setSymbol(data.pair);
      setSelectedPair(data.pair);
      await executeTrade();
    } else {
      setState(prev => ({
        ...prev,
        bestPairMessage: data.message || '⛔ No qualified pair found.'
      }));
    }
  } catch (err) {
    console.error('Error fetching best scoring pair:', err);
    setState(prev => ({
      ...prev,
      bestPairMessage: '❌ Failed to fetch best scoring pair.'
    }));
  }
};


  const fetchOpenOrders = async () => {
    setLoadingOrders(true);
    try {
      if (!api_Key || !apiSecKey) {
        console.error('API key or secret key is missing');
        return;
      }
      const url = process.env.NODE_ENV === 'production'
        ? 'https://freedombot.online/api/open-orders'
        : 'http://localhost:8001/api/open-orders';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': api_Key,
          'X-API-SECRET-KEY': apiSecKey,
          'X-EXCHANGE-TYPE': exchangeType
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch open orders:${response.status} ${response.statusText}`);

      const data = await response.json();
      setOpenOrders(data.openOrders); // Update state directly
      setError(null); // Clear any previous error
    } catch (error) {
      console.error('Error fetching open orders:', error);

    } finally {
      setLoadingOrders(false);
    }
  };

  const closeOrder = async (orderId, symbol) => {
    setClosingOrderIds((prev) => [...prev, orderId]);
    try {
      // Call your API to close the order
      const response = await fetch(
        process.env.NODE_ENV === 'production'
          ? `https://freedombot.online/api/close-all-open-orders?symbol=${symbol}`
          : `http://localhost:8001/api/close-all-open-orders?symbol=${symbol}`,
        {
          method: 'DELETE',
          headers: {
            'X-API-KEY': api_Key,
            'X-API-SECRET-KEY': apiSecKey,
            'X-EXCHANGE-TYPE': exchangeType
          },
        }
      );
      if (!response.ok) throw new Error('Failed to close order');
      // Optionally refresh orders after closing
      await fetchOpenOrders();
    } catch (error) {
      alert('Error closing order: ' + error.message);
    } finally {
      setClosingOrderIds((prev) => prev.filter((id) => id !== orderId));
    }
  };



  const fetchOpenPositions = async () => {
    setLoadingPositions(true);
    try {
      if (!api_Key || !apiSecKey) {
        console.error('API key or secret key is missing');
        return;
      }
      const url = process.env.NODE_ENV === 'production'


        ? 'https://freedombot.online/api/open-positions'


        : 'http://localhost:8001/api/open-positions';

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': api_Key,
          'X-API-SECRET-KEY': apiSecKey,
          'X-EXCHANGE-TYPE': exchangeType

        },
      });

      if (!response.ok) throw new Error(`Failed to fetch open positions: ${response.status} ${response.statusText}`);

      const data = await response.json();
      setOpenPositions(data.openPositions); // Update state directly
      console.log('here are the positions', data);
      setError(null); // Clear any previous error
    } catch (error) {
      console.error('Error fetching open positions:', error);
    } finally {
      setLoadingPositions(false);
    }
  };

  const closePosition = async (symbol) => {
    try {
      const response = await fetch(
        process.env.NODE_ENV === 'production'
          ? `https://freedombot.online/api/close-position`
          : `http://localhost:8001/api/close-position`,
        { 
          method: 'POST',
          body: JSON.stringify({
            symbol: symbol
          }),
          headers: {
            'X-API-KEY': api_Key,
            'X-API-SECRET-KEY': apiSecKey,
            'Content-Type':'application/json',
            'X-EXCHANGE-TYPE': exchangeType
        }
         }
      );


      if (!response.ok) throw new Error(`Failed to close position for ${symbol}`);

      alert(`Position for ${symbol} closed successfully.`);
      fetchOpenPositions(); // Refresh open positions

    } catch (error) {
      console.error(`Error closing position for ${symbol}:`, error);

    }

  };

  const startBot = () => {
    dispatch(controlBot());
  };

  const stopBot = () => {
    dispatch(handleStopBot());
    setAccountInfo(null);
    setTradeDecision(null)
  };

  const connectExchange = async () => {
    dispatch(handleApiKeyChanges({ apiKey: !api_Key?.toString().trim() ? apiKey : api_Key, apiSecretKey: !apiSecKey?.toString().trim() ? apiSecretKey : apiSecKey }))
    try {
      const response = await fetch(process.env.NODE_ENV == 'production' ? 'https://freedombot.online/api/set-api-keys' : 'http://localhost:8001/api/set-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exchangeType: exchangeType === 'binanceFutures' ? 'binancefutures'
                : exchangeType === 'binanceFuturesTestnet' ? 'binancefuturestestnet'
                : 'binance',
                 apiKey,
                 apiSecretKey,
        })
      });
      if (!response.ok) {
        throw new Error('Failed to connect to exchange');
      }
      const data = await response.json();

      dispatch(connectExchanger({ accountId: data.accountId }))
    } catch (error) {
      console.error('Error connecting to exchange:', error);
      dispatch(disconnectExchanger())
    }
  };


  const disconnectExchange = () => {
    dispatch(disconnectExchanger())
    setAccountInfo(null);
    setTradeDecision(null);
  };

 const fetchAutomaticTradingPairs = async () => {
  try {
    const response = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo');

    // Filter only active USDT perpetual pairs
    const automatedPairs = response.data.symbols
      .filter(symbol => symbol.status === 'TRADING' && symbol.contractType === 'PERPETUAL' && symbol.quoteAsset === 'USDT')
      .map(symbol => symbol.symbol);

    const volatilityPromises = automatedPairs.map(async pair => {
      try {
        const res = await axios.get(
          `https://fapi.binance.com/fapi/v1/klines?symbol=${pair}&interval=30m&limit=100`
        );
        const klines = res.data;

        if (klines.length < 10) {
          return { pair, priceChangePercent: 0 };
        }

        const firstOpen = parseFloat(klines[0][1]);
        const lastClose = parseFloat(klines[klines.length - 1][4]);

        const priceChangePercent = Math.abs(((lastClose - firstOpen) / firstOpen) * 100);

        return { pair, priceChangePercent };
      } catch (error) {
        console.error(`Error fetching klines for pair ${pair}:`, error);
        return { pair, priceChangePercent: 0 };
      }
    });

    const volatilityData = await Promise.all(volatilityPromises);

    const mostVolatilePair = volatilityData.reduce((prev, current) =>
      current.priceChangePercent > prev.priceChangePercent ? current : prev
    );

    setState(prevState => ({
      ...prevState,
      selectedPair: mostVolatilePair.pair,
      symbol: mostVolatilePair.pair,
      automated_pairs: mostVolatilePair.pair,
    }));

    setSymbol(mostVolatilePair.pair);
    setSelectedPair(mostVolatilePair.pair);

    console.log('Most Volatile Pair (Highest Price Change %):', mostVolatilePair.pair);
  } catch (error) {
    console.error('Error fetching automated trading pairs:', error);
  }
};


  const fetchTradingPairs = async () => {
    try {
      const response = await fetch('${getBaseUrl()}/fapi/v1/exchangeInfo');
      if (!response.ok) {
        throw new Error('Failed to fetch trading pairs');
      }
      const data = await response.json();
      const pairs = data.symbols.map(symbol => symbol.symbol);
      setTradingPairs(pairs);
      console.log("here are the trading pairs", tradingPairs)

    } catch (error) {
      console.error('Error fetching trading pairs:', error);
      setTradingPairs([]);
    }
  };

    
  const handleAutomaticTrade = () => {
    setTradingManual("automatic");
    fetchAutomaticTradingPairs();
  }
   const handleSmartTrade = async () => {
  try {
    setTradingManual("smart");
    await fetchTopPairsFromBackend();
    await fetchBestScoringPair(); // Will call executeTrade internally
  } catch (error) {
    console.error("Error running smart trade manually:", error);
  }
};

  const handleManualTrade = () => {
    setTradingManual("manual");
    setSymbol(selectedPair);
  }
   const executeTrade = async (customTradeDecision = null) => {
    if (!tradeDecision && !isManuallyTriggered) return;
  
    try {
      setIsExecutingTrade(true);
  
      const response = await fetch(
        process.env.NODE_ENV === 'production' 
          ? 'https://freedombot.online/api/execute-trade' 
          : 'http://localhost:8001/api/execute-trade', 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': userEmail,
            'x-exchange-type': exchangeType  // ✅ Send exchangeType to backend

          },
          body: JSON.stringify({
            apiKey: !api_Key.toString().trim() ? apiKey : api_Key,
            symbol,
            apiSecretKey: !apiSecKey?.toString().trim() ? apiSecretKey : apiSecKey,
            tradeDecision:isManuallyTriggered ? customTradeDecision : tradeDecision,
            exchangeType,
            orderType,
            selectedPair
          })
        }
      );
  
      const data = await response.json();
      setTradeResult(data.message);
      setTradeResultVisible(true);
    } catch (error) {
      console.error(`Error executing ${tradeDecision.toLowerCase()} trade:`, error);
    } finally {
      setIsExecutingTrade(false);
    }
  };

  useEffect(() => {
    if (isBotRunning && isConnected && api_Key && apiSecKey) {
      if(tradingManual === "smart"){
    fetchTopPairsFromBackend();
    fetchBestScoringPair();
     runSmartBot(); // ✅ 
   }
      if(tradingManual == 'manual'){
        fetchTradingPairs();
      }
      else {
        fetchAutomaticTradingPairs();
      }
    }
  }, [isBotRunning, isConnected, api_Key, apiSecKey]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  useEffect(() => {
    const fetchAccountInfo = async () => {
      try {
        const response = await fetch(process.env.NODE_ENV == 'production' ? 'https://freedombot.online/api/usdt-balance' : 'http://localhost:8001/api/usdt-balance', {
          headers: {
            'X-API-KEY': api_Key,
            'X-API-SECRET-KEY': apiSecKey,
            'X-EXCHANGE-TYPE': exchangeType
          }
        });
        if (!response.ok) {
          throw new Error('Error fetching account info');
        }
        const data = await response.json();
        setAccountInfo(data.usdtBalance);
      } catch (error) {
        console.error('Error fetching account info:', error);
        setAccountInfo(null);
      }
    };

    const fetchTradeDecision = async () => {
      try {
        const response = await fetch(process.env.NODE_ENV == 'production' ? `https://freedombot.online/api/trade-decision?symbol=${selectedPair}` : `http://localhost:8001/api/trade-decision?symbol=${selectedPair}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trading decision');
        }
        const { decision } = await response.json();
        setTradeDecision(decision);
      } catch (error) {
        console.error('Error fetching trade decision:', error);
        setTradeDecision(null);
      }
    };

    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(process.env.NODE_ENV == 'production' ? `https://freedombot.online/api/historical-data/${selectedPair}` : `http://localhost:8001/api/historical-data/${selectedPair}`);
        if (!response.ok) {
          throw new Error('Failed to fetch historical data');
        }
        const data = await response.json();
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    if (isBotRunning && isConnected && api_Key && apiSecKey && symbol ) {
      fetchAccountInfo();
      fetchTradeDecision();
      fetchOpenOrders();
      fetchOpenPositions();
      fetchHistoricalData();
      fetchTradingPairs();
      if(tradingManual === "automatic"){
        fetchAutomaticTradingPairs();
      }
       if (tradingManual === "smart") {
         fetchTopPairsFromBackend();
         fetchBestScoringPair();
          runSmartBot(); // ✅ Add Smart Logic Execution Here Too
        }

      const intervalId = setInterval(()=>{
        fetchAccountInfo();
        fetchTradeDecision();
        fetchTradingPairs();
        fetchOpenOrders();
        fetchOpenPositions();
        if (tradingManual == "automatic") {
          fetchAutomaticTradingPairs();
        }
         if (tradingManual === "smart") {
         fetchTopPairsFromBackend();
         fetchBestScoringPair();
          runSmartBot(); // ✅ Add Smart Logic Execution Here Too
        }


      },600000)
      return () => clearInterval(intervalId);

    }
  }, [isBotRunning, isConnected, apiKey, apiSecretKey, selectedPair, tradingManual]);

  useEffect(() => {
    if (tradeDecision && isBotRunning && isConnected && symbol && !isManuallyTriggered) {
      console.log('Trade execution is starting  with trade decision and symbol:', tradeDecision, symbol);
      executeTrade();
    }
  }, [tradeDecision, isBotRunning, isConnected, symbol]);
  const handleManualTriggeredTrade = (type) => {
    setIsManuallyTriggered(true);
    executeTrade(type);
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      const filtered = tradingPairs.filter(pair =>
        pair.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPairs(filtered);
    }, 300); // 300ms debounce
  
    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, tradingPairs]);





  return (
    <>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        <div className='glass_morphism p-4'>
          <p className="text-white flex justify-center  font-semibold">FreeDom</p>
          <div className='flex flex-col gap-y-3'>
            <div className="flex flex-col gap-y-1">
              <p className="text-white text-sm font-normal text-start">API Key</p>
              <input type="text" value={!api_Key.toString().trim() ? apiKey : api_Key} onChange={(e) => {
                setApiKey(e.target.value)
              }} placeholder="Enter API Key" className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-white text-sm" />
            </div>
            <div className="flex flex-col gap-y-1">
              <p className="text-white text-sm font-normal text-start">API Secret Key</p>
              <input type="password" value={!apiSecKey?.toString().trim() ? apiSecretKey : apiSecKey} onChange={(e) => {
                setApiSecretKey(e.target.value)
              }} placeholder="Enter API Secret Key" className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-white text-sm" />
            </div>
            <div className="flex flex-col gap-y-1">
              <p className="text-white text-sm font-normal text-start" >Exchange Type:</p>
              <select className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-black text-sm" value={exchangeType} onChange={(e) => setExchangeType(e.target.value)}>
                <option className='bg-transparent text-black' value="spot">Binance Spot Trading</option>
                <option className='bg-transparent text-black' value="binanceFutures">Binance Futures Trading</option>
                 <option className='bg-transparent text-black' value="binanceFuturesTestnet">Binance Futures (Testnet)</option>
              </select>

            </div>
            <div className={`${apiSecKey && api_Key && 'flex gap-x-4'}`}>
              {
                apiSecKey && api_Key && (
                  <button className='bg-white/20 text-red-500 w-[95%] md:w-[50%] mx-auto  rounded-xl p-2' onClick={handleClearKeys}>Clear Keys</button>
                )
              }
              {!isConnected ? (
                <button onClick={connectExchange} className='bg-white/20 text-green-500 w-[95%] md:w-[50%] mx-auto  rounded-xl p-2'>Connect Exchange</button>
              ) : (
                <>
                  <button onClick={disconnectExchange} className='bg-white/20 text-red-500 w-[95%] md:w-[50%] rounded-xl p-2'>Disconnect Exchange</button>
                </>
              )}

            </div>


            <div className='flex flex-col gap-y-1'>
              <p className='text-white  font-medium '>Bot Control</p>
              <div className='w-full flex flex-col md:flex-row justify-between gap-x-8 gap-y-2'>
                {!isBotRunning ? (
                  <button className='bg-white/20 text-green-500 w-[95%] md:w-[50%] rounded-xl p-2' onClick={startBot}>Start Bot</button>
                ) : (
                  <>
                    <button onClick={stopBot} className='bg-white/20 text-red-500 w-[99.5%] md:w-[50%] rounded-xl p-2'>Stop Bot</button>
                  </>
                )}
                <button className={`bg-white/20 ${showAccountInfo ? 'text-red-500' : 'text-green-500'} w-[99.5%] md:w-[50%] rounded-xl p-2`} onClick={() => setShowAccountInfo(!showAccountInfo)}>
                  {showAccountInfo ? 'Hide Account Info' : 'Show Account Info'}
                </button>

              </div>
              {tradeDecision && (
                <p className='text-green-500'>Trade Decision: {tradeDecision}</p>
              )}
              {tradeResultVisible && (
                <div className="flex flex-col">
                  <p className='text-white font-medium'>Trade Result</p>
                  <p className='text-white'>{tradeResult}</p>
                </div>
              )}
            </div>
            {accId && <p className='text-green-500'>Connected to Binance (Account ID: {accId})</p>}
            {/* {!accId && <p>Connect to Binance</p>} */}
          </div>

        </div>


        <div className='glass_morphism p-4 flex flex-col gap-y-3'>
          <p className="text-white flex justify-center  font-semibold">Trading Options</p>
          <div className='flex items-center gap-x-8 justify-center'>
            <button className={` w-[85%] md:w-[40%] rounded-xl p-2 py-1 ${tradingManual == "automatic" ? 'bg-green-500 text-white' : 'bg-white/20 text-green-500'}`} onClick={handleAutomaticTrade}>Automatic</button>
            <button className={` w-[85%] md:w-[40%] rounded-xl p-2 py-1 ${tradingManual == "manual" ? 'bg-green-500 text-white' : 'bg-white/20 text-green-500'}`} onClick={handleManualTrade}>Manual</button>
            <button className={` w-[85%] md:w-[40%] rounded-xl p-2 py-1 ${tradingManual== "smart" ? 'bg-green-500 text-white' : 'bg-white/20 text-green-500'}`} onClick={handleSmartTrade}>Smart</button>
          </div>
          <div className='flex flex-col gap-y-3'>
            <div className="flex flex-col gap-y-1">
              <p className="text-white text-sm font-normal text-start">Trading Pair</p>

              {tradingManual === 'automatic' ? (
                <div className="text-white border border-white p-1 px-4 min-h-8 bg-transparent rounded-md text-sm">
                  {selectedPair}
                </div>
              ) :
                (


<div className="relative" ref={dropdownRef}>
  <input
    type="text"
    placeholder="Search trading pair..."
    className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md text-sm w-full"
    value={searchQuery}
    onFocus={() => setShowDropdown(true)}
    onChange={(e) => {
      setSearchQuery(e.target.value);
      setShowDropdown(true);
    }}
  />
  {showDropdown && (
    <div className="absolute bg-white w-full rounded-md mt-1 max-h-40 overflow-y-auto shadow-md z-10">
      {filteredPairs.length > 0 ? (
        filteredPairs.map(pair => (
          <div
            key={pair}
            onClick={() => {
              setSelectedPair(pair);
              setSymbol(pair);
              setSearchQuery(pair); // Optionally update the input
              setShowDropdown(false); // Hide dropdown after selection
            }}
            className="p-2 hover:bg-green-100 cursor-pointer text-black"
          >
            {pair}
          </div>
        ))
      ) : (
        <div className="p-2 text-gray-500">No results</div>
      )}
    </div>
  )}
</div>
                  // <select disabled={tradingManual === 'automatic'} className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-black text-sm" value={selectedPair} onChange={(e) => {
                  //   setSelectedPair(e.target.value);
                  //   setSymbol(e.target.value); // Update the symbol state
                  // }}>
                  //   {tradingPairs.map(pair => (
                  //     <option className='bg-transparent text-black' key={pair} value={pair}>{pair}</option>
                  //   ))}
                  // </select>
                )
              }
               {/* ✅ Smart Strategy Info UI */}
            {tradingManual === 'smart' && (
           <div className="bg-white/10 text-white text-sm mt-2 p-2 rounded-lg flex flex-col gap-y-1">
              <p><span className="font-bold">Smart Signal:</span> {state.strategySignal || "N/A"}</p>
              <p><span className="font-bold">Strategy Score:</span> {state.strategyScore ?? "N/A"}</p>
              <p><span className="font-bold">Smart Message:</span> {state.bestPairMessage || "N/A"}</p>
              <p><span className="font-bold">Top Volatile Pairs:</span> {state.topVolatilePairs?.join(', ') || "N/A"}</p>
               ) : (
             <p className="text-yellow-300 italic">Waiting for smart strategy recommendation...</p>
           </div>
            )}
            </div>
            <div className="flex flex-col gap-y-1">
              <p className="text-white text-sm font-normal text-start">Order Type</p>
              <select className="text-white border border-white p-1 px-4 outline-none bg-transparent rounded-md placeholder:text-black text-sm" value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                {orderTypes.map(type => (
                  <option className='bg-transparent text-black' key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-x-2">
                <button 
                  onClick={()=>handleManualTriggeredTrade('Buy')} 
                  className="w-[48%] bg-green-500 text-white rounded-xl p-2 hover:bg-green-600 transition"
                  disabled={isExecutingTrade || !isBotRunning}
                >
                  Buy
                </button>
                <button 
                  onClick={()=>handleManualTriggeredTrade('Sell')} 
                  className="w-[48%] bg-red-500 text-white rounded-xl p-2 hover:bg-red-600 transition"
                  disabled={isExecutingTrade || !isBotRunning}
                >
                  Sell
                </button>
              </div>
            {
              (isExecutingTrade && isBotRunning) && (
                <p className='text-white animate-pulse'>Trade executing...</p>
              )}
            {(!isExecutingTrade && isBotRunning) && (
              <p className='text-green'>Trade execution stopped</p>
            )
            }

            {showAccountInfo && accountInfo && (
              <div className='flex flex-col text-white'>
                <h5 className='text-white font-bold'>Account Information</h5>
                {/* Placeholder for additional account information */}
                <p>Asset: <span className='text-green-500'>{accountInfo.asset}</span></p>
                <p>Wallet Balance:<span className='text-green-500'>{accountInfo.walletBalance}</span></p>
                <p>Unrealized Profit: <span className='text-green-500'>{accountInfo.unrealizedProfit}</span></p>
                <p>Margin Balance:<span className='text-green-500'>{accountInfo.marginBalance}</span> </p>
                <p>Position Initial Margin:<span className='text-green-500'>{accountInfo.positionInitialMargin}</span></p>
                <p>Open Order Initial Margin: <span className='text-green-500'>{accountInfo.openOrderInitialMargin}</span></p>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="glass_morphism p-6 flex flex-col gap-y-4 mt-6 rounded-2xl shadow-lg">
        <p className="text-white text-center text-2xl font-bold mb-2 tracking-wide">Open Orders</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Open Positions */}
          <div className="bg-white/20 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
            <button
              onClick={fetchOpenPositions}
              className="bg-white/20 text-white font-semibold rounded-lg px-4 py-2 mb-2 transition flex items-center justify-center"
              disabled={loadingPositions}
            >
              {loadingPositions && (
                <svg className="animate-spin h-4 w-4 mr-2 text-gray-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              Refresh Positions
            </button>
            <h3 className="text-lg text-white font-semibold mb-2">Open Positions</h3>
            <div className="flex flex-col gap-2">
              {openPositions.length > 0 ? (
                openPositions.map((position) => (
                  <div key={position.symbol} className="bg-white/20 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="font-bold">{position.symbol}</span>
                      <span className="mx-2">|</span>
                      <span>Amt: {position.positionAmt}</span>
                      <span className="mx-2">|</span>
                      <span>PnL: {parseInt(position.unRealizedProfit).toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => closePosition(position.symbol)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      Close
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-200 italic">No open positions.</p>
              )}
            </div>
          </div>
          {/* Open Orders */}
          <div className="bg-white/20 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
            <button
              onClick={fetchOpenOrders}
              className="bg-white/20 text-white font-semibold rounded-lg px-4 py-2 mb-2 transition flex items-center justify-center"
              disabled={loadingOrders}
            >
              {loadingOrders && (
                <svg className="animate-spin h-4 w-4 mr-2 text-gray-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              Refresh Orders
            </button>
            <h3 className="text-lg text-white font-semibold mb-2">Open Orders</h3>
            <div className="flex flex-col gap-2">
              {openOrders.length > 0 ? (
                openOrders.map((order) => (
                  <div key={order.orderId} className="bg-white/20 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="font-bold">{order.symbol}</span>
                      <span className="mx-2">|</span>
                      <span>{order.side}</span>
                      <span className="mx-2">|</span>
                      <span>Status: {order.status}</span>
                      <span className="mx-2">|</span>
                      <span>Type: {order.type}</span>
                    </div>
                    <button
                      onClick={() => closeOrder(order.orderId, order.symbol)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                      disabled={closingOrderIds.includes(order.orderId)}
                    >
                      {closingOrderIds.includes(order.orderId) ? (
                        <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : null}
                      Close
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-200 italic">No open orders.</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </>

  );
}

export default withAuth(Trade);
