# studying-german

독일어 학습 위키 — 순수 HTML/CSS/JavaScript로 만든 개인 문법 노트 사이트.

## 기능

- 사이드바 네비게이션
- 실시간 검색
- 카드 접기/펼치기
- Nominativ / Akkusativ / Dativ / Genitiv 태그
- 단어·동사 비교 카드 (kennen vs wissen, fallen vs gefallen 등)
- 날짜별 복습 카드
- 전체 누적 복습 퀴즈 (독일어→한국어 / 한국어→독일어)
- 모바일 반응형, Apple UI 스타일

## 학습 내용 추가

새로 공부한 내용은 `data/review-data.js`의 `window.GERMAN_REVIEW_DAYS` 배열에 날짜 단위로 추가합니다.

```js
{
  date: '2026-06-19',
  title: '수업 복습',
  summary: '오늘 배운 문장과 표현',
  items: [
    {
      id: '2026-06-19-01',
      type: 'sentence',
      tags: ['Perfekt'],
      de: 'Was ist passiert?',
      ko: '무슨 일이 있었어?',
      words: [['Was', '무엇이'], ['ist ... passiert', '일어났다']],
      grammar: ['passieren은 완료형에서 sein을 씁니다.'],
      confusion: ['Was passiert?는 현재, Was ist passiert?는 과거입니다.']
    }
  ]
}
```

복습 페이지는 이 데이터를 자동으로 읽어 날짜별 카드 목록과 전체 퀴즈에 반영합니다.

## 실행

```bash
open index.html
```

또는 로컬 서버:

```bash
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속.
