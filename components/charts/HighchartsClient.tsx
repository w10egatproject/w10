'use client';

import { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

type HighchartsClientProps = {
  options: unknown;
};

export default function HighchartsClient({ options }: HighchartsClientProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    import('highcharts/highcharts-3d')
      .catch(() => null)
      .finally(() => {
        if (isMounted) setIsReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-400">
        Loading Chart
      </div>
    );
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
