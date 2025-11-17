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
  const pairsPerPage = 8;

  // Redux store exchange type
  const exchangeType = useSelector((state) => state.user.exchangeType);

  // Firestore real-time fetch
  useEffect(() => {
    const q = query(
      collection(db, "qualifiedPairs"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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

      if (!response.ok) throw new Error(`Failed to fetch best pair. Status: ${response.status}`);
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

  const formatDate = (ts) => ts ? new Date(ts.seconds * 1000).toLocaleString() : "N/A";

  const formatSupportResistance = (sr) =>
    sr ? `Price: ${sr.price} | Qty: ${sr.qty}` : "N/A";

  // Pagination
  const indexOfLastPair = currentPage * pairsPerPage;
  const indexOfFirstPair = indexOfLastPair - pairsPerPage;
  const currentPairs = pairs.slice(indexOfFirstPair, indexOfLastPair);
  const totalPages = Math.ceil(pairs.length / pairsPerPage);

  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
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
      body: [[
        pair.pair,
        pair.signal,
        pair.score,
        formatSupportResistance(pair.strongSupport),
        formatSupportResistance(pair.strongResistance),
        formatDate(pair.createdAt),
      ]],
      startY: 50,
      styles: { fontSize: 11 },
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
    });

    doc.save(`${pair.pair}_report.pdf`);
  };

  const exportExcel = (pair) => {
    const ws = XLSX.utils.json_to_sheet([{
      Pair: pair.pair,
      Signal: pair.signal,
      Score: pair.score,
      Support: formatSupportResistance(pair.strongSupport),
      Resistance: formatSupportResistance(pair.strongResistance),
      Time: formatDate(pair.createdAt),
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pair Report");
    ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 25 }];
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
        body: chunk.map(p => [
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
        alternateRowStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255] },
      });
    }

    doc.save("qualified_pairs_report.pdf");
  };

  const exportAllExcel = () => {
    const ws = XLSX.utils.json_to_sheet(pairs.map(p => ({
      Pair: p.pair,
      Signal: p.signal,
      Score: p.score,
      Support: formatSupportResistance(p.strongSupport),
      Resistance: formatSupportResistance(p.strongResistance),
      Time: formatDate(p.createdAt),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Pairs");
    ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 25 }];
    XLSX.writeFile(wb, "qualified_pairs_report.xlsx");
  };

  const columns = ["Pair", "Signal", "Score", "Support", "Resistance", "Time", "Actions"];

  return (
    <div className="p-6 bg-black min-h-screen rounded-md shadow-md text-white">
      <h2 className="text-2xl font-bold mb-4">🔥 Qualified Pairs ({exchangeType})</h2>

      <div className="flex gap-3 mb-6">
        <button onClick={exportAllPDF} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow font-bold">⬇ Export All to PDF</button>
        <button onClick={exportAllExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow font-bold">⬇ Export All to Excel</button>
      </div>

      {loading ? (
        <TableSkeleton columns={columns} />
      ) : (
        <>
          <table className="w-full border border-gray-700 shadow-sm rounded">
            <thead className="bg-gray-900">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="p-3 text-left font-bold border-b text-gray-200">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentPairs.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4 text-gray-400 italic">No pairs found</td>
                </tr>
              ) : (
                currentPairs.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-800 transition duration-150 ${highlightedIds.includes(p.id) ? "bg-green-700 animate-pulse" : ""}`}
                  >
                    <td className="p-3 border-b">{p.pair}</td>
                    <td className="p-3 border-b">{p.signal}</td>
                    <td className="p-3 border-b">{p.score}</td>
                    <td className="p-3 border-b">{formatSupportResistance(p.strongSupport)}</td>
                    <td className="p-3 border-b">{formatSupportResistance(p.strongResistance)}</td>
                    <td className="p-3 border-b">{formatDate(p.createdAt)}</td>
                    <td className="p-3 border-b flex gap-2">
                      <button onClick={() => exportPDF(p)} className="bg-blue-700 hover:bg-blue-800 text-white px-2 py-1 rounded text-sm font-bold">PDF</button>
                      <button onClick={() => exportExcel(p)} className="bg-yellow-500 hover:bg-yellow-600 text-black px-2 py-1 rounded text-sm font-bold">Excel</button>
                      <button onClick={() => deletePair(p.id)} className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded text-sm font-bold">❌</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-4 text-white">
            <button onClick={goToPrevPage} disabled={currentPage === 1} className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded disabled:opacity-50">Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={goToNextPage} disabled={currentPage === totalPages} className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded disabled:opacity-50">Next</button>
          </div>
        </>
      )}
    </div>
  );
}
