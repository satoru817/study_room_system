"use client";

import { useState, useEffect } from "react";
import { doPost } from "../../elfs/WebserviceElf";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StudyTimeChart({ studentId }) {
  const [chartData, setChartData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("4weeks");
  const [loading, setLoading] = useState(true);
  const [totalHours, setTotalHours] = useState(0);
  const [averageHours, setAverageHours] = useState(0);

  const periodOptions = [
    { value: "4weeks", label: "1ヶ月", weeks: 4 },
    { value: "12weeks", label: "3ヶ月", weeks: 12 },
    { value: "24weeks", label: "半年", weeks: 24 },
    { value: "all", label: "全期間", weeks: 0 },
  ];

  useEffect(() => {
    fetchStudyHistory();
  }, [selectedPeriod]);

  const fetchStudyHistory = async () => {
    setLoading(true);
    try {
      const selectedOption = periodOptions.find(
        (opt) => opt.value === selectedPeriod
      );
      const requestBody = {
        isAll: selectedPeriod === "all",
        weeks: selectedOption.weeks,
      };

      const response = await doPost(
        `/api/attendance/histories/${studentId}`,
        requestBody
      );

      const formattedData = response.histories.map((record) => {
        const date = new Date(record.weekStartDay);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = (record.totalMinutes / 60).toFixed(1);

        return {
          weekStart: `${month}/${day}`,
          hours: parseFloat(hours),
          fullDate: record.weekStartDay,
        };
      });

      setChartData(formattedData);

      const total = formattedData.reduce(
        (sum, record) => sum + record.hours,
        0
      );
      const average =
        formattedData.length > 0 ? total / formattedData.length : 0;

      setTotalHours(total.toFixed(1));
      setAverageHours(average.toFixed(1));
    } catch (error) {
      console.error("学習履歴の取得に失敗:", error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-800">
            {payload[0].payload.weekStart}の週
          </p>
          <p className="text-lg font-bold text-blue-600">
            {payload[0].value}時間
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
        📊 学習時間の推移
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {periodOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedPeriod(option.value)}
            className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              selectedPeriod === option.value
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 active:bg-gray-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">累計時間</p>
          <p className="text-2xl font-bold text-blue-600">{totalHours}h</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">週平均</p>
          <p className="text-2xl font-bold text-green-600">{averageHours}h</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="weekStart"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                stroke="#9ca3af"
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                stroke="#9ca3af"
                label={{
                  value: "時間",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12, fill: "#6b7280" },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: "#2563eb", r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg
            className="w-16 h-16 mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-center">この期間のデータがありません</p>
          <p className="text-sm text-center mt-2">
            自習室を利用すると記録されます
          </p>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <p className="text-sm text-gray-700">
            {totalHours > 0 ? (
              <>
                <span className="font-bold text-blue-600">すばらしい！</span>
                {` ${
                  selectedPeriod === "all"
                    ? "今まで"
                    : periodOptions.find((opt) => opt.value === selectedPeriod)
                        ?.label
                }で${totalHours}時間も学習しました！`}
                {averageHours > 10 && " この調子で頑張りましょう🔥"}
              </>
            ) : (
              "これから頑張りましょう！💪"
            )}
          </p>
        </div>
      )}
    </div>
  );
}
