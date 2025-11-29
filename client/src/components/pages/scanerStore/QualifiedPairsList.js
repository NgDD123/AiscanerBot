import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import TableSkeleton from "../../Table/tableSkeleton";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export default function QualifiedPairsList() {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pairsPerPage = 4;

  const exchangeType = useSelector((state) => state.user.exchangeType);

  // ---------------- Firestore subscription ----------------
  useEffect(() => {
    console.log("Setting up Firestore snapshot...");
    const q = query(
      collection(db, "qualifiedPairs"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log("Snapshot received:", data);
        setPairs(data);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ---------------- Fetch best scoring pair from backend ----------------
  const fetchBestScoringPair = async () => {
    try {
      const response = await fetch("http://localhost:8001/api/best-pair", {
        headers: { "X-EXCHANGE-TYPE": exchangeType || "binanceFutures" },
      });

      if (!response.ok)
        throw new Error(`Failed to fetch best pair. Status: ${response.status}`);

      const data = await response.json();
      console.log("Fetched best pair:", data);

      if (!data.pair) return;

      // 🔹 Upsert: use pair as doc ID and merge
      const pairDocRef = doc(db, "qualifiedPairs", data.pair);

      await setDoc(
        pairDocRef,
        {
          pair: data.pair,
          signal: data.signal,
          score: data.score,
          strongSupport: data.strongSupport ?? null,
          strongResistance: data.strongResistance ?? null,
          ltp: data.ltp != null ? Number(data.ltp) : null,
          pipDistance: data.pipDistance != null ? Number(data.pipDistance) : null,
          profitPercent: data.profitPercent != null ? Number(data.profitPercent) : null,
          stopLoss: data.stopLoss != null ? Number(data.stopLoss) : null,
          stopLossPips: data.stopLossPips != null ? Number(data.stopLossPips) : null,
          riskRewardRatio: data.riskRewardRatio != null ? Number(data.riskRewardRatio) : null,
          suggestedLeverage: data.suggestedLeverage != null ? Number(data.suggestedLeverage) : null,
          largeBidWalls: data.largeBidWalls || [],
          largeAskWalls: data.largeAskWalls || [],
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      setHighlightedIds((prev) => [...prev, data.pair]);
      setTimeout(() => {
        setHighlightedIds((prev) => prev.filter((id) => id !== data.pair));
      }, 5000);
    } catch (err) {
      console.error("❌ Error fetching best scoring pair:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBestScoringPair();
    const interval = setInterval(fetchBestScoringPair, 10000);
    return () => clearInterval(interval);
  }, [exchangeType]);

  // ---------------- Delete a pair ----------------
  const deletePair = async (id) => {
    try {
      await deleteDoc(doc(db, "qualifiedPairs", id));
      console.log("Deleted pair:", id);
    } catch (err) {
      console.error("❌ Error deleting pair:", err);
    }
  };

  // ---------------- Format helpers ----------------
  const formatDate = (ts) =>
    ts ? new Date(ts.seconds * 1000).toLocaleString() : "N/A";

  const formatSupportResistance = (sr) =>
    sr ? `Price: ${sr.price} ` : "N/A";

  const formatArray = (arr) =>
    arr && arr.length > 0 ? arr.map((a) => `${a.price}@${a.qty}`).join(", ") : "N/A";

  const profitColor = (value) =>
    value == null ? "text-yellow-400" : value > 0 ? "text-green-400" : "text-red-600";

  const rrColor = (value) =>
    value == null ? "text-yellow-400" : value >= 1 ? "text-green-400" : "text-red-600";

  // ---------------- Pagination ----------------
  const indexOfLastPair = currentPage * pairsPerPage;
  const indexOfFirstPair = indexOfLastPair - pairsPerPage;
  const currentPairs = pairs.slice(indexOfFirstPair, indexOfLastPair);
  const totalPages = Math.ceil(pairs.length / pairsPerPage);
  const goToNextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToPrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <div className="p-6 bg-gradient-to-r from-gray-900 via-black to-gray-800 min-h-screen rounded-xl shadow-2xl text-white">
      <h2 className="text-3xl md:text-4xl font-extrabold mb-6 flex items-center gap-3">
        🔥 Qualified Pairs{" "}
        <span className="text-green-400 text-lg md:text-xl">({exchangeType})</span>
      </h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => currentPairs.length && exportPDF(currentPairs[0])}
          className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-lg shadow-lg font-bold transform hover:scale-105 transition"
        >
          ⬇ Export All PDF
        </button>
        <button
          onClick={() => currentPairs.length && exportExcel(currentPairs[0])}
          className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-lg shadow-lg font-bold transform hover:scale-105 transition"
        >
          ⬇ Export All Excel
        </button>
      </div>

      {loading ? (
        <TableSkeleton
          columns={[
            "Pair",
            "Signal",
            "Score",
            "Support",
            "Resistance",
            "Time",
            "Actions",
          ]}
        />
      ) : currentPairs.length === 0 ? (
        <p className="text-center text-gray-400 italic">No pairs found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {currentPairs.map((p) => (
            <div
              key={p.id}
              className={`bg-gray-900 rounded-3xl shadow-2xl p-8 border-l-4 flex flex-col justify-between h-full w-full ${
                highlightedIds.includes(p.id)
                  ? "border-green-400 animate-pulse"
                  : "border-gray-700"
              } transform hover:scale-105 transition duration-300`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column */}
                <div>
                  <h3 className="text-2xl font-extrabold mb-3">{p.pair}</h3>
                  <p
                    className={`font-bold text-xl mb-2 ${
                      p.signal?.toLowerCase() === "buy"
                        ? "text-green-400"
                        : p.signal?.toLowerCase() === "sell"
                        ? "text-red-700"
                        : "text-yellow-400"
                    }`}
                  >
                    {p.signal ?? "N/A"}
                  </p>
                  <p className="mb-2 text-lg">Score: {p.score ?? "N/A"}</p>
                  <p className="mb-1 text-gray-100">
                    BUY: {formatSupportResistance(p.strongSupport)}
                  </p>
                  <p className="mb-1 text-gray-100">
                    SELL: {formatSupportResistance(p.strongResistance)}
                  </p>
                  <p className="text-gray-500 text-sm mb-3">{formatDate(p.createdAt)}</p>
                </div>

                {/* Right Column */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <p className="font-semibold text-gray-300">LTP:</p>
                  <p>{p.ltp != null ? p.ltp : "N/A"}</p>

                  <p className="font-semibold text-gray-300">Pip Distance:</p>
                  <p>{p.pipDistance != null ? p.pipDistance : "N/A"}</p>

                  <p className="font-semibold text-gray-300">Take Profit %:</p>
                  <p className={profitColor(p.profitPercent)}>{p.profitPercent != null ? p.profitPercent : "N/A"}</p>

                  <p className="font-semibold text-gray-300">Stop Loss:</p>
                  <p>{p.stopLoss != null ? p.stopLoss : "N/A"}</p>

                  <p className="font-semibold text-gray-300">SL Pips:</p>
                  <p>{p.stopLossPips != null ? p.stopLossPips : "N/A"}</p>

                  <p className="font-semibold text-gray-300">R/R Ratio:</p>
                  <p className={rrColor(p.riskRewardRatio)}>{p.riskRewardRatio != null ? p.riskRewardRatio : "N/A"}</p>

                  <p className="font-semibold text-gray-300">Leverage:</p>
                  <p>{p.suggestedLeverage != null ? p.suggestedLeverage : "N/A"}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => exportPDF(p)}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded text-sm font-bold flex-1"
                >
                  PDF
                </button>
                <button
                  onClick={() => exportExcel(p)}
                  className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-sm font-bold flex-1"
                >
                  Excel
                </button>
                <button
                  onClick={() => deletePair(p.id)}
                  className="bg-red-700 hover:bg-red-800 px-4 py-2 rounded text-sm font-bold flex-1"
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 1}
          className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-lg shadow transition disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-200 font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="bg-gray-700 hover:bg-gray-800 px-4 py-2 rounded-lg shadow transition disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
