interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
          {icon}
        </div>
      )}
      <p className="text-3xl font-black text-gray-900 mt-3">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      )}
      <p className="text-xs font-medium text-emerald-600 mt-2">&#8593; vs last month</p>
    </div>
  );
}
