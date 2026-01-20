'use client';

import { useEffect, useRef, useState } from 'react';
import PageLayout from '@/components/PageLayout';

let Artplayer: any = null;
let Hls: any = null;

export default function WebLivePage() {
  const artRef = useRef<HTMLDivElement | null>(null);
  const artPlayerRef = useRef<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [currentSource, setCurrentSource] = useState<any | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('artplayer').then(mod => { Artplayer = mod.default; });
      import('hls.js').then(mod => { Hls = mod.default; });
    }
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/web-live/sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch (err) {
      console.error('获取直播源失败:', err);
    }
  };

  function m3u8Loader(video: HTMLVideoElement, url: string) {
    if (!Hls) return;
    const hls = new Hls({ debug: false, enableWorker: true, lowLatencyMode: true });
    hls.loadSource(url);
    hls.attachMedia(video);
    (video as any).hls = hls;
  }

  useEffect(() => {
    if (!Artplayer || !Hls || !videoUrl || !artRef.current) return;

    if (artPlayerRef.current) {
      artPlayerRef.current.destroy();
    }

    artPlayerRef.current = new Artplayer({
      container: artRef.current,
      url: videoUrl,
      isLive: true,
      autoplay: true,
      customType: { m3u8: m3u8Loader },
      icons: { loading: '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 100 100"><circle cx="50" cy="50" fill="none" stroke="currentColor" stroke-width="4" r="35" stroke-dasharray="164.93361431346415 56.97787143782138"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="1s" values="0 50 50;360 50 50" keyTimes="0;1"/></circle></svg>' }
    });

    return () => {
      if (artPlayerRef.current) {
        artPlayerRef.current.destroy();
        artPlayerRef.current = null;
      }
    };
  }, [videoUrl]);

  const handleSourceClick = async (source: any) => {
    setCurrentSource(source);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/web-live/stream?platform=${source.platform}&roomId=${source.roomId}`);
      if (res.ok) {
        const data = await res.json();
        setVideoUrl(data.url);
      }
    } catch (err) {
      console.error('获取直播流失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageLayout activePath='/web-live'>
      <div className='flex flex-col gap-4 p-5'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>网络直播</h1>
        <div className='grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4'>
          <div ref={artRef} className='w-full aspect-video bg-black rounded-lg' />
          <div className='flex flex-col gap-2 max-h-[600px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4'>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2'>直播列表</h2>
            {sources.map((source) => (
              <button
                key={source.key}
                onClick={() => handleSourceClick(source)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  currentSource?.key === source.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className='font-medium'>{source.name}</div>
                <div className='text-sm opacity-75'>{source.platform === 'huya' ? '虎牙' : source.platform}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
