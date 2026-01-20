import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const roomId = searchParams.get('roomId');

    if (!platform || !roomId) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    if (platform === 'huya') {
      const res = await fetch(`https://mp.huya.com/cache.php?m=Live&do=profileRoom&roomid=${roomId}`);
      const data = await res.json();

      if (data.status === 200 && data.data?.liveStatus === 'ON') {
        const stream = data.data.stream;
        const url = `${stream.flv.multiLine[0].url}/${stream.flv.streamName}.${stream.flv.sFlvUrlSuffix}?${stream.flv.sFlvAntiCode}`;
        return NextResponse.json({ url });
      }

      return NextResponse.json({ error: '直播未开启' }, { status: 404 });
    }

    return NextResponse.json({ error: '不支持的平台' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}
