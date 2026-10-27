// Vercel 서버리스 함수: API Key 는 환경변수(PIXABAY_API_KEY)에서만 읽는다.
module.exports = async (req, res) => {
  // 파일(file://)로 연 페이지에서도 호출할 수 있게 허용 (키는 응답에 포함되지 않음)
  res.setHeader('Access-Control-Allow-Origin', '*');

  const key = process.env.PIXABAY_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'PIXABAY_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  const q = String(req.query.q || '').trim().slice(0, 100);
  const page = Math.min(Math.max(parseInt(req.query.page, 10) || 1, 1), 50);
  if (!q) {
    return res.status(400).json({ error: '검색어를 입력해 주세요.' });
  }

  const params = new URLSearchParams({
    key,
    q,
    page,
    per_page: 10,
    image_type: 'photo',
    safesearch: 'true',
    lang: 'ko',
  });

  try {
    const upstream = await fetch('https://pixabay.com/api/?' + params);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Pixabay 오류 (' + upstream.status + ')' });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json({
      totalHits: data.totalHits,
      hits: data.hits.map((h) => ({
        id: h.id,
        tags: h.tags,
        user: h.user,
        webformatURL: h.webformatURL,
        pageURL: h.pageURL,
      })),
    });
  } catch (err) {
    return res.status(502).json({ error: 'Pixabay 에 연결하지 못했습니다.' });
  }
};
