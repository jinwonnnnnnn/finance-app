import 'dotenv/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const glossaryData = [
  // ─── 주식 기초 (출처: 금융감독원 금융교육센터) ───
  {
    term: 'PER',
    simple: '주가를 주당순이익으로 나눈 값',
    detail:
      'PER(Price Earnings Ratio)은 현재 주가가 주당 순이익의 몇 배인지를 나타내는 지표입니다. 금융감독원은 PER을 활용해 기업의 상대적 가치를 평가하도록 권고합니다. PER이 낮을수록 이익에 비해 주가가 싸다는 의미이지만, 산업별로 평균이 다르므로 같은 업종끼리 비교해야 합니다.',
    example: '삼성전자 주가 8만원, 주당순이익 5천원이면 PER = 16배',
    category: '주식기초',
    source: '금융감독원 금융교육센터 (https://www.fss.or.kr)',
  },
  {
    term: 'PBR',
    simple: '주가를 주당순자산으로 나눈 값',
    detail:
      'PBR(Price Book-value Ratio)은 주가가 회사의 순자산(자본) 대비 몇 배인지 보여줍니다. PBR 1 미만이면 청산가치보다 주가가 낮다는 뜻입니다. 금융감독원은 자산 중심 기업(은행, 건설 등) 분석 시 PBR이 유용하다고 안내합니다.',
    example: '순자산 1조원, 시가총액 8천억이면 PBR = 0.8',
    category: '주식기초',
    source: '금융감독원 금융교육센터',
  },
  {
    term: 'ROE',
    simple: '자본 대비 순이익 비율 — 회사가 돈을 얼마나 잘 버는지',
    detail:
      'ROE(Return on Equity)는 주주가 투자한 자본으로 기업이 얼마의 이익을 창출하는지 보여주는 지표입니다. ROE가 높을수록 경영 효율이 좋습니다. 한국은행 경제교육 자료에 따르면 ROE 15% 이상이면 우량 기업으로 분류하는 경향이 있습니다.',
    example: '순이익 300억, 자기자본 1000억 → ROE = 30%',
    category: '주식기초',
    source: '한국은행 경제교육 (https://www.bok.or.kr)',
  },
  {
    term: '배당',
    simple: '기업이 이익을 주주에게 나눠주는 것',
    detail:
      '배당이란 기업이 영업활동으로 얻은 이익의 일부를 주주에게 분배하는 행위입니다. 금융감독원은 배당을 현금배당과 주식배당으로 구분합니다. 배당수익률 = 주당 배당금 ÷ 주가 × 100%로 계산합니다.',
    example: '주가 5만원, 배당금 1,000원 → 배당수익률 2%',
    category: '주식기초',
    source: '금융감독원 금융교육센터',
  },
  {
    term: '시가총액',
    simple: '회사 전체 가치를 돈으로 나타낸 것',
    detail:
      '시가총액은 현재 주가에 발행 주식 수를 곱한 값으로, 기업의 시장 가치를 나타냅니다. 한국거래소(KRX)에서는 시가총액을 기준으로 코스피200 등 지수를 구성합니다.',
    example: '주가 8만원 × 주식 수 60억 주 = 시가총액 480조원',
    category: '주식기초',
    source: '한국거래소 KRX (https://www.krx.co.kr)',
  },

  // ─── ETF / 펀드 (출처: 금융감독원) ───
  {
    term: 'ETF',
    simple: '주식처럼 사고팔 수 있는 펀드',
    detail:
      'ETF(Exchange Traded Fund)는 특정 지수나 자산을 추종하며 주식시장에 상장된 펀드입니다. 금융감독원은 ETF를 분산투자와 낮은 수수료의 장점이 있는 상품으로 소개합니다. 소액으로 수십~수백 개 종목에 분산투자할 수 있습니다.',
    example: 'KODEX 200 ETF → 코스피 200개 종목에 한번에 투자',
    category: 'ETF/펀드',
    source: '금융감독원 금융교육센터',
  },
  {
    term: '인덱스 펀드',
    simple: '특정 주가지수를 그대로 따라가는 펀드',
    detail:
      '인덱스 펀드는 코스피, S&P500 같은 시장 지수를 추종하여 운용하는 펀드입니다. 금융감독원은 능동적 운용보다 비용이 낮고 장기적으로 시장 수익률을 얻을 수 있다는 점에서 초보자에게 적합하다고 안내합니다.',
    example: 'S&P500 인덱스 펀드 → 미국 대표 500개 기업에 투자',
    category: 'ETF/펀드',
    source: '금융감독원 금융교육센터',
  },
  {
    term: '분산투자',
    simple: '여러 자산에 나눠 투자해 위험을 줄이는 전략',
    detail:
      '분산투자는 한 종목이나 자산에 집중하지 않고 여러 자산에 나눠 투자하는 방식입니다. 금융감독원과 한국은행 모두 분산투자를 통한 리스크 관리를 강조합니다. "달걀을 한 바구니에 담지 말라"는 격언이 핵심입니다.',
    example: '주식 60% + 채권 30% + 현금 10% 분산 보유',
    category: 'ETF/펀드',
    source: '금융감독원 금융교육센터',
  },

  // ─── 채권 (출처: 한국은행, 기획재정부) ───
  {
    term: '채권',
    simple: '정부나 기업이 돈을 빌리며 발행하는 차용증',
    detail:
      '채권은 발행자가 투자자에게 원금과 이자 지급을 약속하는 증권입니다. 한국은행에 따르면 국채는 정부가, 회사채는 기업이 발행합니다. 일반적으로 주식보다 안전하지만 수익률은 낮습니다.',
    example: '국채 3년물 3.5% → 3년 후 원금 + 연 3.5% 이자 수령',
    category: '채권',
    source: '한국은행 경제교육',
  },
  {
    term: '금리',
    simple: '돈을 빌리는 대가로 내는 이자 비율',
    detail:
      '금리는 자금을 빌리거나 빌려줄 때 적용되는 이자율입니다. 한국은행 기준금리는 모든 금리의 기준이 됩니다. 금리가 오르면 채권 가격은 내려가고, 금리가 내리면 채권 가격은 올라가는 역(逆)관계가 있습니다.',
    example: '기준금리 3.5% → 은행 예금금리, 대출금리 모두 영향받음',
    category: '채권',
    source: '한국은행 (https://www.bok.or.kr)',
  },

  // ─── 퇴직연금/연금 (출처: 고용노동부, 금융감독원) ───
  {
    term: 'IRP',
    simple: '직장인이 퇴직금을 모으는 개인형 퇴직연금 계좌',
    detail:
      'IRP(Individual Retirement Pension)는 근로자가 재직 중 또는 퇴직 후 자유롭게 납입하고 운용할 수 있는 개인형 퇴직연금 계좌입니다. 고용노동부·금융감독원 공동 자료에 따르면 연 900만원까지 세액공제 혜택(16.5%)이 있습니다.',
    example: '연봉 5천만원 직장인이 IRP에 연 600만원 납입 → 99만원 세금 환급',
    category: '퇴직연금',
    source: '고용노동부·금융감독원 퇴직연금 포털 (https://pension.fss.or.kr)',
  },
  {
    term: 'DC형 퇴직연금',
    simple: '내가 직접 운용하는 퇴직연금',
    detail:
      'DC(Defined Contribution)형은 회사가 매년 연봉의 1/12을 계좌에 적립하고 근로자가 직접 운용하는 방식입니다. 금융감독원은 투자에 관심 있고 적극적인 근로자에게 DC형이 적합하다고 안내합니다.',
    example: '연봉 4800만원 → 회사가 매달 33만원 적립, 내가 ETF 등으로 운용',
    category: '퇴직연금',
    source: '금융감독원 퇴직연금 포털',
  },
  {
    term: 'DB형 퇴직연금',
    simple: '회사가 알아서 운용하고 퇴직 시 확정액을 주는 퇴직연금',
    detail:
      'DB(Defined Benefit)형은 퇴직급여액이 근속연수와 최종 급여에 따라 확정되는 방식입니다. 금융감독원에 따르면 임금 상승률이 높거나 장기 근속 예정인 근로자에게 유리합니다.',
    example: '근속 10년, 최종 월급 400만원 → 퇴직금 4,000만원 확정',
    category: '퇴직연금',
    source: '금융감독원 퇴직연금 포털',
  },
  {
    term: 'ISA',
    simple: '세금 혜택이 있는 만능 투자 계좌',
    detail:
      'ISA(Individual Savings Account)는 하나의 계좌에서 예금, 펀드, ETF, 주식 등을 운용할 수 있으며 발생한 이익에 대해 200만원(서민·농어민형 400만원)까지 비과세 혜택을 받는 계좌입니다. 금융감독원은 ISA를 중장기 재산형성 수단으로 추천합니다.',
    example: '3년 이상 유지 조건, 200만원 비과세 후 나머지 이익은 9.9% 분리과세',
    category: '퇴직연금',
    source: '금융감독원 금융교육센터',
  },

  // ─── 암호화폐 (출처: 금융위원회) ───
  {
    term: '비트코인',
    simple: '세계 최초 암호화폐',
    detail:
      '비트코인은 2009년 사토시 나카모토가 만든 최초의 블록체인 기반 암호화폐입니다. 금융위원회는 가상자산은 법정화폐가 아니며 가격 변동성이 매우 크므로 투자 시 주의가 필요하다고 경고합니다. 발행 한도는 2,100만 개로 제한되어 있습니다.',
    example: '1BTC = 약 8,000만원 (2024년 기준, 변동성 큼)',
    category: '암호화폐',
    source: '금융위원회 (https://www.fsc.go.kr)',
  },
  {
    term: '블록체인',
    simple: '거래 내역을 여러 컴퓨터에 분산 저장하는 기술',
    detail:
      '블록체인은 거래 정보를 블록 단위로 묶어 체인처럼 연결하고, 중앙 서버 없이 참여자 모두가 보관하는 분산원장 기술입니다. 한국은행은 블록체인을 금융 인프라 혁신 기술로 연구 중입니다.',
    example: '은행 없이도 A→B 송금 내역을 수천 대 컴퓨터가 동시에 검증·기록',
    category: '암호화폐',
    source: '한국은행 경제교육',
  },

  // ─── 공매도 / 파생상품 ───
  {
    term: '공매도',
    simple: '빌린 주식을 팔고 나중에 싸게 사서 갚는 투자 방법',
    detail:
      '공매도(Short Selling)는 주식을 보유하지 않은 상태에서 빌려서 판 뒤, 주가 하락 후 싸게 사서 갚아 차익을 얻는 방식입니다. 금융감독원은 공매도가 시장 유동성을 높이지만 과도할 경우 주가 하락을 심화시킬 수 있다고 설명합니다.',
    example: '10만원에 빌려서 팔고 → 8만원에 사서 갚기 → 2만원 이익',
    category: '투자전략',
    source: '금융감독원 금융교육센터',
  },
  {
    term: '손절매',
    simple: '더 큰 손실을 막기 위해 손해를 보고 파는 것',
    detail:
      '손절매(Stop-loss)는 예상과 달리 주가가 하락할 때 추가 손실을 방지하기 위해 미리 정한 가격에서 주식을 파는 행위입니다. 금융감독원은 명확한 손절 기준을 세우고 투자하는 것이 리스크 관리의 기본이라고 강조합니다.',
    example: '10만원에 산 주식이 8만원(-20%)이 되면 바로 매도',
    category: '투자전략',
    source: '금융감독원 금융교육센터',
  },
  {
    term: '복리',
    simple: '이자에 이자가 붙는 것 — 장기 투자의 핵심',
    detail:
      '복리(Compound Interest)는 원금뿐 아니라 발생한 이자에도 이자가 붙는 방식입니다. 한국은행 경제교육에서는 복리 효과를 "시간이 지날수록 눈덩이처럼 불어난다"고 설명하며 장기 투자의 핵심 원리로 소개합니다.',
    example: '100만원을 연 7% 복리로 30년 → 약 760만원 (단리였다면 310만원)',
    category: '기본개념',
    source: '한국은행 경제교육',
  },
  {
    term: '포트폴리오',
    simple: '내가 보유한 투자 자산의 구성',
    detail:
      '포트폴리오는 개인이나 기관이 보유한 주식, 채권, 현금 등 투자 자산의 집합체입니다. 금융감독원은 리스크 허용 범위에 맞게 포트폴리오를 구성하고 정기적으로 리밸런싱(비중 재조정)할 것을 권장합니다.',
    example: '국내주식 40% + 해외주식 30% + 채권 20% + 현금 10%',
    category: '기본개념',
    source: '금융감독원 금융교육센터',
  },
];

async function main() {
  console.log('금융용어 시딩 시작...');
  for (const item of glossaryData) {
    await prisma.glossary.upsert({
      where: { term: item.term },
      update: item,
      create: item,
    });
  }
  console.log(`✅ ${glossaryData.length}개 금융용어 시딩 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
