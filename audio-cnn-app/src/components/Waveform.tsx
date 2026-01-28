const Waveform = ({ data, title }: { data: number[]; title: string }) => {
  if (!data || data.length === 0) return null;

  const width = 600;
  const height = 200;
  const centerY = height / 2;

  const validData = data.filter((val) => !isNaN(val) && isFinite(val));
  if (validData.length === 0) return null;

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min;
  const scaleY = height * 0.45;

  const pathData = validData
    .map((sample, i) => {
      const x = (i / (validData.length - 1)) * width;
      let y = centerY;

      if (range > 0) {
        const normalizedSample = (sample - min) / range; // 0 - 1, -0.5 - 0.5
        y = centerY - (normalizedSample - 0.5) * 2 * scaleY;
      }

      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <div className="flex w-full flex-col">
      <div className="flex items-center justify-center">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="block h-[180px] w-full rounded border border-stone-200"
        >
          {/* Grid lines */}
          <path
            d={`M 0 ${height * 0.25} H ${width}`}
            stroke="#f5f5f4"
            strokeWidth="1"
          />
          <path
            d={`M 0 ${centerY} H ${width}`}
            stroke="#d6d3d1"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
          <path
            d={`M 0 ${height * 0.75} H ${width}`}
            stroke="#f5f5f4"
            strokeWidth="1"
          />
          {/* Waveform */}
          <path
            d={pathData}
            fill="none"
            stroke="#44403c"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {title && <p className="mt-2 text-center text-xs text-stone-500">{title}</p>}
    </div>
  );
};

export default Waveform;