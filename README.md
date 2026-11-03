# 펀치 게임 — 3명 × 3방향 사진 반응 버전

## 이번 수정 내용

- **평평이, 버럭씨, 아방이**의 3방향 반응 사진 **총 9장** 추가
- `왼쪽 뺨`, `정면 펀치`, `오른쪽 뺨` 클릭 시 해당 사진으로 **약 1초간 전환**, 이후 기본 사진 복귀
- 대사, 버럭씨의 💢, 아방이의 💧, 효과음, 댓글창 유지
- 중복 주먹 이모지는 제거했어요. 반응 사진에 이미 손이 등장합니다.
- 댓글 서비스는 GitHub Issues를 사용하는 Utterances이며, 설치 및 Issues 활성화가 따로 필요해요.

## 3방향 이미지 연결표

| 캐릭터 | 왼쪽 뺨 | 정면 펀치 | 오른쪽 뺨 |
|---|---|---|---|
| 버럭씨 | `reactions/beoreok-left.webp` | `reactions/beoreok-front.webp` | `reactions/beoreok-right.webp` |
| 평평이 | `reactions/flat-left.webp` | `reactions/flat-front.webp` | `reactions/flat-right.webp` |
| 아방이 | `reactions/abang-left.webp` | `reactions/abang-front.webp` | `reactions/abang-right.webp` |

정면, 왼쪽, 오른쪽 사진의 배정은 사용자가 제공한 순서대로 맞췄습니다.

## GitHub Pages 업데이트

1. 압축을 **해제**합니다.
2. `punch-game` 저장소의 **Code → Add file → Upload files**에서 **ZIP 안 내용물**을 업로드합니다. `index.html`이 저장소 **최상위**에 있어야 하고, `reactions` **폴더 구조는 유지**해야 합니다.
3. **Commit changes**를 눌러 저장하세요. 기존 파일과 같은 이름은 업데이트되도록 확인하세요.
4. 배포가 완료되면 `https://sarang09145-coder.github.io/punch-game/`을 새로고침합니다. 예전 화면이 남는다면 강력 새로고침(Ctrl+F5)도 해보세요.

`Deploy from a branch`를 **다시 설정할 필요는 없습니다.**

## 폴더 구조

```text
punch-game/
├── index.html
├── script.js
├── style.css
├── README.md
├── flat.png
├── beoreok.png
├── abang.png
└── reactions/
    ├── flat-left.webp
    ├── flat-front.webp
    ├── flat-right.webp
    ├── beoreok-left.webp
    ├── beoreok-front.webp
    ├── beoreok-right.webp
    ├── abang-left.webp
    ├── abang-front.webp
    └── abang-right.webp
```

## 이미지 교체하기

원하는 반응을 바꾸려면 `reactions/` 폴더의 **같은 파일명**으로 교체하면 됩니다. WEBP를 직접 만들기 어렵다면 `script.js`의 `reactionPath()` 함수 확장자 `.webp`를 `.png`로 바꾸고 같은 이름의 PNG 파일을 올려도 됩니다.
