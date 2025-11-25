import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
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

  // Firestore real-time fetch
  useEffect(() => {
    const q = query(
      collection(db, "qualifiedPairs"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPairs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch best scoring pair from backend
  const fetchBestScoringPair = async () => {
    try {
      const response = await fetch("http://localhost:8001/api/best-pair", {
        headers: { "X-EXCHANGE-TYPE": exchangeType || "binanceFutures" },
      });
      if (!response.ok)
        throw new Error(
          `Failed to fetch best pair. Status: ${response.status}`,
        );
      const data = await response.json();

      if (data.pair) {
        const exists = pairs.some((p) => p.pair === data.pair);
        if (!exists) {
          const docRef = await addDoc(collection(db, "qualifiedPairs"), {
            pair: data.pair,
            signal: data.signal,
            score: data.score,
            strongSupport: data.strongSupport || null,
            strongResistance: data.strongResistance || null,
            createdAt: serverTimestamp(),
          });

          setHighlightedIds((prev) => [...prev, docRef.id]);
          setTimeout(() => {
            setHighlightedIds((prev) => prev.filter((id) => id !== docRef.id));
          }, 5000);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching best scoring pair:", err);
    }
  };

  useEffect(() => {
    fetchBestScoringPair();
    const interval = setInterval(fetchBestScoringPair, 60000);
    return () => clearInterval(interval);
  }, [exchangeType]);

  const deletePair = async (id) => {
    try {
      await deleteDoc(doc(db, "qualifiedPairs", id));
    } catch (err) {
      console.error("❌ Error deleting pair:", err);
    }
  };

  const formatDate = (ts) =>
    ts ? new Date(ts.seconds * 1000).toLocaleString() : "N/A";
  const formatSupportResistance = (sr) =>
    sr ? `Price: ${sr.price} | Qty: ${sr.qty}` : "N/A";

  // Pagination
  const indexOfLastPair = currentPage * pairsPerPage;
  const indexOfFirstPair = indexOfLastPair - pairsPerPage;
  const currentPairs = pairs.slice(indexOfFirstPair, indexOfLastPair);
  const totalPages = Math.ceil(pairs.length / pairsPerPage);
  const goToNextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const goToPrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // PDF/Excel exports
  const exportPDF = (pair) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Qualified Pair Report", 14, 20);
    doc.setFontSize(12);
    doc.text("Brand: GB & MA", 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

    doc.autoTable({
      head: [["Pair", "Signal", "Score", "Support", "Resistance", "Time"]],
      body: [
        [
          pair.pair,
          pair.signal,
          pair.score,
          formatSupportResistance(pair.strongSupport),
          formatSupportResistance(pair.strongResistance),
          formatDate(pair.createdAt),
        ],
      ],
      startY: 50,
      styles: { fontSize: 11 },
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
      alternateRowStyles: {
        fillColor: [50, 50, 50],
        textColor: [255, 255, 255],
      },
    });

    doc.save(`${pair.pair}_report.pdf`);
  };

  const exportExcel = (pair) => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Pair: pair.pair,
        Signal: pair.signal,
        Score: pair.score,
        Support: formatSupportResistance(pair.strongSupport),
        Resistance: formatSupportResistance(pair.strongResistance),
        Time: formatDate(pair.createdAt),
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pair Report");
    ws["!cols"] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
    ];
    XLSX.writeFile(wb, `${pair.pair}_report.xlsx`);
  };

  const exportAllPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Qualified Pairs Report", 14, 20);
    doc.setFontSize(12);
    doc.text("Brand: GB & MA", 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

    const chunkSize = 8;
    for (let i = 0; i < pairs.length; i += chunkSize) {
      if (i > 0) doc.addPage();
      const chunk = pairs.slice(i, i + chunkSize);
      doc.autoTable({
        head: [["Pair", "Signal", "Score", "Support", "Resistance", "Time"]],
        body: chunk.map((p) => [
          p.pair,
          p.signal,
          p.score,
          formatSupportResistance(p.strongSupport),
          formatSupportResistance(p.strongResistance),
          formatDate(p.createdAt),
        ]),
        startY: 50,
        styles: { fontSize: 11, textColor: [255, 255, 255] },
        headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
        alternateRowStyles: {
          fillColor: [50, 50, 50],
          textColor: [255, 255, 255],
        },
      });
    }
    doc.save("qualified_pairs_report.pdf");
  };

  const exportAllExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      pairs.map((p) => ({
        Pair: p.pair,
        Signal: p.signal,
        Score: p.score,
        Support: formatSupportResistance(p.strongSupport),
        Resistance: formatSupportResistance(p.strongResistance),
        Time: formatDate(p.createdAt),
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Pairs");
    ws["!cols"] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 8 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
    ];
    XLSX.writeFile(wb, "qualified_pairs_report.xlsx");
  };

  return (
    <div className="p-6 bg-gradient-to-r from-gray-900 via-black to-gray-800 min-h-screen rounded-xl shadow-2xl text-white">
      <h2 className="text-3xl md:text-4xl font-extrabold mb-6 flex items-center gap-3">
        🔥 Qualified Pairs{" "}
        <span className="text-green-400 text-lg md:text-xl">
          ({exchangeType})
        </span>
      </h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={exportAllPDF}
          className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-lg shadow-lg font-bold transform hover:scale-105 transition"
        >
          ⬇ Export All PDF
        </button>
        <button
          onClick={exportAllExcel}
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
              className={`bg-gray-900 rounded-3xl shadow-2xl p-8 border-l-4 flex flex-col justify-between h-full w-full ${highlightedIds.includes(p.id)
                  ? "border-green-400 animate-pulse"
                  : "border-gray-700"
                } transform hover:scale-105 transition duration-300`}
            >
              <div>
                <h3 className="text-2xl font-extrabold mb-3">{p.pair}</h3>
                <p
                  className={`font-bold text-xl mb-2 ${p.signal.toLowerCase() === "buy"
                      ? "text-green-400"
                      : p.signal.toLowerCase() === "sell"
                        ? "text-red-700"
                        : "text-yellow-400"
                    }`}
                >
                  {p.signal}
                </p>
                <p className="mb-2 text-lg">Score: {p.score}</p>
                <p className="mb-1 text-gray-100">
                  BUY: {formatSupportResistance(p.strongSupport)}
                </p>
                <p className="mb-1 text-gray-100">
                  SELL: {formatSupportResistance(p.strongResistance)}
                </p>
                <p className="text-gray-500 text-sm mb-3">
                  {formatDate(p.createdAt)}
                </p>
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
