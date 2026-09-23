import type React from "react";

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

const MetricCard = ({ label, value, icon }: MetricCardProps) => {
  return (
    <article className="flex items-center justify-between border border-brand-border p-4 rounded-md gap-2 bg-white">
      <div>
        <span className="font-normal text-md">{label}</span>

        <p className="text-2xl font-medium">{value}</p>
      </div>

      <div className="flex items-center justify-center bg-[rgb(0,35,149)]/20 text-avk-blue p-4 rounded-full">
        {icon}
      </div>
    </article>
  );
};

export default MetricCard;
