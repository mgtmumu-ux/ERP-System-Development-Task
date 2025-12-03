import { GoogleGenAI } from "@google/genai";
import { Product, Transaction } from "../types";

const API_KEY = process.env.API_KEY || '';

export const generateInventoryAnalysis = async (
  products: Product[],
  transactions: Transaction[]
): Promise<string> => {
  if (!API_KEY) {
    return "API Key Gemini tidak ditemukan. Harap konfigurasi environment variable.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Prepare a summary of data to avoid token limits
    const lowStockItems = products.filter(p => p.currentStock <= p.minStock);
    const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.price), 0);
    const recentTransactions = transactions.slice(0, 20); // Last 20

    const prompt = `
      Anda adalah asisten manajer gudang AI. Analisis data inventaris berikut dan berikan rekomendasi singkat dalam format Markdown yang rapi.
      
      Bahasa: Indonesia.
      
      Data Ringkasan:
      - Total Produk: ${products.length}
      - Total Nilai Aset: ${totalValue.toLocaleString()}
      - Barang Stok Menipis (Bahaya): ${lowStockItems.map(p => `${p.name} (Sisa: ${p.currentStock}, Min: ${p.minStock})`).join(', ')}
      
      Transaksi Terakhir:
      ${JSON.stringify(recentTransactions.map(t => ({ type: t.type, date: t.date, ref: t.referenceNo, items: t.items.length })))}

      Tugas:
      1. Berikan peringatan prioritas untuk restock.
      2. Analisis tren singkat berdasarkan transaksi terakhir (apakah lebih banyak barang masuk atau keluar?).
      3. Saran efisiensi gudang.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Gagal mendapatkan analisis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan saat menghubungi AI. Silakan coba lagi nanti.";
  }
};
