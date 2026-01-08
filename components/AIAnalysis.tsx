import React, { useState, useMemo } from 'react';
import { User, Plan } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Sparkles, TrendingUp, AlertTriangle, Target, 
  Brain, CheckCircle, Zap, Search, Calendar 
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Tooltip
} from 'recharts';

interface AIAnalysisProps {
  currentUser: User;
  users: User[];
  plans: Plan[];
}

interface AnalysisResult {
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ currentUser, users, plans }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    currentUser.role === 'employee' ? currentUser.employee_id : ''
  );
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // --- 1. Filter and Aggregate Data ---
  const aggregatedData = useMemo(() => {
    if (!selectedEmployeeId) return null;

    const filteredPlans = (plans || []).filter(p => {
      const planDate = new Date(p.date);
      return (
        p.employee_id === selectedEmployeeId &&
        planDate.getMonth() + 1 === selectedMonth &&
        planDate.getFullYear() === selectedYear
      );
    });

    const totals = {
      sim_target: 0, sim_result: 0,
      fiber_target: 0, fiber_result: 0,
      mytv_target: 0, mytv_result: 0,
      cntt_target: 0, cntt_result: 0,
      revenue_target: 0, revenue_result: 0,
      count: filteredPlans.length,
      manager_comments: [] as string[]
    };

    filteredPlans.forEach(p => {
      totals.sim_target += p.sim_target || 0;
      totals.sim_result += p.sim_result || 0;
      totals.fiber_target += p.fiber_target || 0;
      totals.fiber_result += p.fiber_result || 0;
      totals.mytv_target += p.mytv_target || 0;
      totals.mytv_result += p.mytv_result || 0;
      totals.cntt_target += p.cntt_target || 0;
      totals.cntt_result += p.cntt_result || 0;
      totals.revenue_target += p.revenue_cntt_target || 0;
      totals.revenue_result += p.revenue_cntt_result || 0;
      if (p.manager_comment) totals.manager_comments.push(p.manager_comment);
    });

    return totals;
  }, [plans, selectedEmployeeId, selectedMonth, selectedYear]);

  // --- 2. Prepare Chart Data (Normalized) ---
  const chartData = useMemo(() => {
    if (!aggregatedData || aggregatedData.count === 0) return [];
    
    // Normalize logic: Cap at 120% to keep chart readable
    const normalize = (target: number, result: number) => {
      if (target === 0) return result > 0 ? 100 : 0;
      const pct = (result / target) * 100;
      return Math.min(pct, 120);
    };

    return [
      { subject: 'SIM', A: normalize(aggregatedData.sim_target, aggregatedData.sim_result), fullMark: 100, actual: aggregatedData.sim_result, target: aggregatedData.sim_target },
      { subject: 'Fiber', A: normalize(aggregatedData.fiber_target, aggregatedData.fiber_result), fullMark: 100, actual: aggregatedData.fiber_result, target: aggregatedData.fiber_target },
      { subject: 'MyTV', A: normalize(aggregatedData.mytv_target, aggregatedData.mytv_result), fullMark: 100, actual: aggregatedData.mytv_result, target: aggregatedData.mytv_target },
      { subject: 'CNTT', A: normalize(aggregatedData.cntt_target, aggregatedData.cntt_result), fullMark: 100, actual: aggregatedData.cntt_result, target: aggregatedData.cntt_target },
      { subject: 'Doanh Thu', A: normalize(aggregatedData.revenue_target, aggregatedData.revenue_result), fullMark: 100, actual: aggregatedData.revenue_result, target: aggregatedData.revenue_target, isRevenue: true },
    ];
  }, [aggregatedData]);

  // --- 3. Gemini AI Integration ---
  const handleAnalyze = async () => {
    if (!aggregatedData || !selectedEmployeeId) return;
    setIsAnalyzing(true);

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("Chưa cấu hình API Key (process.env.API_KEY)");
      }

      const ai = new GoogleGenAI({ apiKey });
      const employeeName = (users || []).find(u => u.employee_id === selectedEmployeeId)?.employee_name || "Nhân viên";

      const prompt = `
        Bạn là một Giám đốc Kinh doanh cấp cao tại VNPT. Hãy phân tích hiệu quả công việc của nhân viên ${employeeName} trong tháng ${selectedMonth}/${selectedYear} dựa trên dữ liệu sau:
        
        - Di động (SIM): Mục tiêu ${aggregatedData.sim_target}, Thực đạt ${aggregatedData.sim_result}
        - Internet (Fiber): Mục tiêu ${aggregatedData.fiber_target}, Thực đạt ${aggregatedData.fiber_result}
        - Truyền hình (MyTV): Mục tiêu ${aggregatedData.mytv_target}, Thực đạt ${aggregatedData.mytv_result}
        - Dịch vụ CNTT: Mục tiêu ${aggregatedData.cntt_target}, Thực đạt ${aggregatedData.cntt_result}
        - Doanh thu CNTT: Mục tiêu ${(aggregatedData.revenue_target/1000000).toFixed(1)} triệu, Thực đạt ${(aggregatedData.revenue_result/1000000).toFixed(1)} triệu
        - Nhận xét từ quản lý trực tiếp (nếu có): ${aggregatedData.manager_comments.join("; ")}

        Hãy trả về kết quả dưới dạng JSON (không dùng markdown code block) theo cấu trúc sau:
        {
          "overall_score": (số điểm đánh giá từ 0-100 dựa trên mức độ hoàn thành chỉ tiêu),
          "summary": (Nhận xét tổng quan ngắn gọn, giọng văn chuyên nghiệp, khích lệ),
          "strengths": (Danh sách 3 điểm mạnh nổi bật nhất),
          "weaknesses": (Danh sách 3 điểm cần cải thiện/yếu kém),
          "recommendations": (Danh sách 3 hành động cụ thể cần làm trong tháng tới để cải thiện doanh số)
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overall_score: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        setAnalysisResult({
            overall_score: parsed.overall_score || 0,
            summary: parsed.summary || "Không có dữ liệu tổng hợp.",
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        });
      }

    } catch (error) {
      console.error("AI Error:", error);
      alert("Không thể phân tích lúc này. Vui lòng kiểm tra API Key hoặc thử lại sau.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER & FILTERS */}
      <div className="bg-white rounded-3xl shadow-sm p-6 border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
               <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                 <Brain size={24} />
               </div>
               Trợ Lý Phân Tích AI
             </h2>
             <p className="text-sm font-medium text-slate-500 mt-1 ml-1">Sử dụng trí tuệ nhân tạo để đánh giá năng lực và gợi ý chiến lược</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            {/* Employee Selector */}
            <div className="flex items-center gap-2 px-2">
               <Search size={16} className="text-slate-400" />
               <select 
                 className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer py-2"
                 value={selectedEmployeeId}
                 onChange={e => { setSelectedEmployeeId(e.target.value); setAnalysisResult(null); }}
                 disabled={currentUser.role === 'employee'}
               >
                 {currentUser.role !== 'employee' && <option value="">-- Chọn nhân viên --</option>}
                 {(users || []).filter(u => u.role !== 'admin').map(u => (
                   <option key={u.id} value={u.employee_id}>{u.employee_name}</option>
                 ))}
               </select>
            </div>
            
            <div className="w-[1px] h-8 bg-slate-300"></div>

            {/* Time Selector */}
            <div className="flex items-center gap-2 px-2">
               <Calendar size={16} className="text-slate-400" />
               <select 
                 className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer py-2"
                 value={selectedMonth}
                 onChange={e => { setSelectedMonth(parseInt(e.target.value)); setAnalysisResult(null); }}
               >
                 {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                   <option key={m} value={m}>Tháng {m}</option>
                 ))}
               </select>
               <select 
                 className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer py-2"
                 value={selectedYear}
                 onChange={e => { setSelectedYear(parseInt(e.target.value)); setAnalysisResult(null); }}
               >
                 <option value={currentYear}>{currentYear}</option>
                 <option value={currentYear - 1}>{currentYear - 1}</option>
               </select>
            </div>
          </div>
        </div>
      </div>

      {aggregatedData && aggregatedData.count > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: CHARTS & STATS */}
          <div className="lg:col-span-5 space-y-6">
             {/* Stats Summary */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng Kế Hoạch</p>
                   <p className="text-2xl font-black text-slate-800">{aggregatedData.count} <span className="text-sm font-medium text-slate-400">báo cáo</span></p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng Doanh Thu</p>
                   <p className="text-2xl font-black text-indigo-600">{(aggregatedData.revenue_result/1000000).toFixed(1)} <span className="text-sm font-medium text-slate-400">Tr</span></p>
                </div>
             </div>

             {/* Radar Chart */}
             <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight mb-6 w-full flex items-center justify-between">
                   <span>Biểu Đồ Năng Lực</span>
                   <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">Tỷ lệ hoàn thành (%)</span>
                </h3>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Hiệu suất"
                        dataKey="A"
                        stroke="#4f46e5"
                        strokeWidth={3}
                        fill="#6366f1"
                        fillOpacity={0.4}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                           if (active && payload && payload.length) {
                             const data = payload[0].payload;
                             return (
                               <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-xs">
                                  <p className="font-black text-slate-700 uppercase mb-1">{data.subject}</p>
                                  <p>Thực đạt: <b className="text-indigo-600">{data.isRevenue ? (data.actual/1000000).toFixed(1) + ' Tr' : data.actual}</b></p>
                                  <p>Mục tiêu: <b className="text-slate-400">{data.isRevenue ? (data.target/1000000).toFixed(1) + ' Tr' : data.target}</b></p>
                                  <p className="mt-1 pt-1 border-t border-slate-100 text-slate-500">Tỷ lệ: {data.A.toFixed(0)}%</p>
                               </div>
                             );
                           }
                           return null;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>

          {/* RIGHT COLUMN: AI ANALYSIS */}
          <div className="lg:col-span-7">
             <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-1 shadow-2xl">
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-[22px] p-8 h-full min-h-[500px] flex flex-col relative overflow-hidden">
                   {/* Background Effects */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                   <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                   {/* Title Area */}
                   <div className="flex justify-between items-center mb-8 relative z-10">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                           <Sparkles className="text-yellow-400" size={20} />
                           Phân Tích Chuyên Sâu
                        </h3>
                        <p className="text-indigo-200 text-sm mt-1">Đánh giá dữ liệu tự động bởi Gemini AI</p>
                      </div>
                      
                      {!isAnalyzing && !analysisResult && (
                         <button 
                           onClick={handleAnalyze}
                           className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-indigo-50 transition shadow-lg shadow-white/10 flex items-center gap-2 animate-pulse"
                         >
                           <Zap size={18} /> Bắt đầu phân tích
                         </button>
                      )}
                   </div>

                   {/* Content Area */}
                   <div className="flex-1 relative z-10">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                           <div className="relative">
                              <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                 <Brain size={24} className="text-white/50" />
                              </div>
                           </div>
                           <p className="text-indigo-200 font-medium animate-pulse">Đang tổng hợp số liệu và phân tích...</p>
                        </div>
                      ) : analysisResult ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                           {/* Score & Summary */}
                           <div className="flex gap-4 items-start bg-white/10 p-5 rounded-2xl border border-white/10">
                              <div className="text-center">
                                 <div className={`text-4xl font-black ${analysisResult.overall_score >= 80 ? 'text-emerald-400' : analysisResult.overall_score >= 50 ? 'text-yellow-400' : 'text-rose-400'}`}>
                                   {analysisResult.overall_score}
                                 </div>
                                 <div className="text-[10px] text-indigo-200 uppercase tracking-wider mt-1">Điểm số</div>
                              </div>
                              <div className="w-[1px] h-12 bg-white/20"></div>
                              <p className="text-sm text-indigo-50 leading-relaxed italic">
                                "{analysisResult.summary}"
                              </p>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Strengths */}
                              <div className="bg-emerald-900/30 p-5 rounded-2xl border border-emerald-500/20">
                                 <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                                   <CheckCircle size={14} /> Điểm Mạnh
                                 </h4>
                                 <ul className="space-y-2">
                                    {analysisResult.strengths?.length > 0 ? analysisResult.strengths.map((s, i) => (
                                      <li key={i} className="text-xs text-emerald-100 flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                                        {s}
                                      </li>
                                    )) : <li className="text-xs text-emerald-100">Chưa có dữ liệu</li>}
                                 </ul>
                              </div>

                              {/* Weaknesses */}
                              <div className="bg-rose-900/30 p-5 rounded-2xl border border-rose-500/20">
                                 <h4 className="text-rose-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                                   <AlertTriangle size={14} /> Cần Cải Thiện
                                 </h4>
                                 <ul className="space-y-2">
                                    {analysisResult.weaknesses?.length > 0 ? analysisResult.weaknesses.map((s, i) => (
                                      <li key={i} className="text-xs text-rose-100 flex items-start gap-2">
                                        <span className="mt-1 w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                                        {s}
                                      </li>
                                    )) : <li className="text-xs text-rose-100">Chưa có dữ liệu</li>}
                                 </ul>
                              </div>
                           </div>

                           {/* Recommendations */}
                           <div className="bg-blue-900/30 p-5 rounded-2xl border border-blue-500/20">
                              <h4 className="text-blue-300 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Target size={14} /> Chiến Lược Tháng Tới
                              </h4>
                              <div className="space-y-2">
                                {analysisResult.recommendations?.length > 0 ? analysisResult.recommendations.map((rec, i) => (
                                   <div key={i} className="flex gap-3 items-start">
                                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-xs flex-shrink-0 border border-blue-500/30">
                                        {i + 1}
                                      </div>
                                      <p className="text-sm text-blue-50">{rec}</p>
                                   </div>
                                )) : <p className="text-sm text-blue-50">Chưa có đề xuất</p>}
                              </div>
                           </div>
                           
                           <div className="text-center pt-2">
                              <button onClick={handleAnalyze} className="text-xs text-indigo-300 hover:text-white transition underline">
                                Phân tích lại
                              </button>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-indigo-300/50">
                           <Sparkles size={48} className="mb-4 opacity-50" />
                           <p className="text-sm">Nhấn nút "Bắt đầu phân tích" để AI đánh giá dữ liệu.</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
           <Search className="mx-auto text-slate-300 mb-4" size={48} />
           <p className="text-slate-500 font-bold">Không tìm thấy dữ liệu báo cáo cho nhân viên/thời gian này.</p>
        </div>
      )}
    </div>
  );
};