/**
 * 售前校招公司库 · 数据层
 *
 * ⚠️ 数据生产规则（详见 docs/公司库数据生产SOP.md）：
 * 1. 无来源不写数据：每个字段必须可溯源（官方页 / 面经帖 / 高校就业网转载）
 * 2. careerUrl 必须经实际访问验证（careerUrlVerified: true）才可信
 * 3. salaryBand 仅在有公开 offer 帖来源时填写（当前全部留空，待 Gate 3 定口径）
 * 4. 本文件由导师（有网络访问的 AI）维护，Trae 只读不写
 *
 * 当前：17 家（2026-09-10 批量验证，验证日志见 SOP §3）。
 * Backlog 见 SOP §4（锐捷/安恒/启明星辰/天融信/浪潮/金山云/中科曙光/金蝶等——有启动线索但官方入口未定位）。
 */

export type Direction = "cloud" | "security" | "network" | "software" | "hardware" | "data";

export interface CompanySource {
  title: string;
  url: string;
  /** official=官方页面 / interview=面经帖 / repost=高校就业网等转载 */
  kind: "official" | "interview" | "repost";
}

export interface HiringHistory {
  year: number;
  batches?: string[];
  note?: string;
  source?: string;
}

export interface Company {
  key: string;
  name: string;
  /** 主营业务一句话（稳定层） */
  business: string;
  directions: Direction[];
  /** 主要工作城市（稳定层，校招岗位实际城市以官网为准） */
  cities: string[];
  /** 薪资带：仅在有公开 offer 帖来源时填写 */
  salaryBand?: string;
  salarySource?: string;
  /** 面试风格：归纳自已核实的面经，sources 中有对应链接 */
  interviewStyle?: string;
  sources: CompanySource[];
  /** 官方校招/投递入口（波动层，唯一权威源） */
  careerUrl: string;
  /** Gate 2：该 URL 是否经过实际访问验证 */
  careerUrlVerified: boolean;
  /** 最近一次核实日期 YYYY-MM-DD */
  verifiedAt: string;
  /** open=有来源表明当前在招；unknown=未核实（默认诚实值） */
  status: "open" | "unknown";
  /** 历年批次时间线（年份归档，只增不删——过期数据变资产） */
  hiringHistory?: HiringHistory[];
}

export const DIRECTION_LABELS: Record<Direction, string> = {
  cloud: "云计算",
  security: "网络安全",
  network: "网络设备",
  software: "软件/IT服务",
  hardware: "硬件/服务器",
  data: "数据/大数据",
};

/**
 * 首批 6 家（全部经 2026-09-10 实际访问验证，验证日志见 SOP）。
 * Backlog 9 家（阿里云/百度智能云/京东云/金山云/联想/安恒/启明星辰/浪潮/中兴）：
 * 本轮搜索未获官方入口，按"无来源不写数据"红线暂不入库，追查线索见 SOP backlog 表。
 */
export const COMPANIES: Company[] = [
  {
    key: "sangfor",
    name: "深信服",
    business: "网络安全与云计算厂商（防火墙、超融合起家，ToB 售前体系成熟）",
    directions: ["security", "cloud", "network"],
    cities: ["深圳", "北京", "成都", "长沙"],
    interviewStyle: "有售前岗完整面经记录（含 offer 复盘），流程与真题见来源链接",
    sources: [
      { title: "牛客·本科小白的秋招～深信服面经", url: "https://www.nowcoder.com/discuss/353158894593712128", kind: "interview" },
      { title: "牛客·深信服售前面经（9.27 已 offer）", url: "https://www.nowcoder.com/feed/main/detail/25376d26532c47c1b4fb1292acd1cecd", kind: "interview" },
      { title: "兰州大学就业网转载·深信服2027届秋季校园招聘启动", url: "https://job.lzu.edu.cn/html/74/article/2026/90687.html", kind: "repost" },
    ],
    careerUrl: "https://hr.sangfor.com/campucompon/schoolRecruitment",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      { year: 2027, note: "2027 届秋季校园招聘已启动（高校就业网转载，以官网为准）", source: "https://job.lzu.edu.cn/html/74/article/2026/90687.html" },
    ],
  },
  {
    key: "qianxin",
    name: "奇安信",
    business: "网络安全厂商（政企安全、安全服务，安全行业售前岗位量大）",
    directions: ["security"],
    cities: ["北京", "上海", "成都", "武汉"],
    interviewStyle: "安全厂商售前面经（已 offer），流程与问题见来源链接",
    sources: [
      { title: "牛客·奇安信 售前工程师面经（已 offer）", url: "https://www.nowcoder.com/discuss/353158415927156736", kind: "interview" },
      { title: "奇安信校园招聘官网·招聘流程", url: "https://campus.qianxin.com/campus/graduates", kind: "official" },
    ],
    careerUrl: "https://campus.qianxin.com/campus/graduates",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      {
        year: 2027,
        batches: ["网申 9 月起", "在线笔试（部分岗位）", "现场/远程面试 9 月起陆续安排", "offer 面试通过后陆续发放"],
        note: "面向 2027 届应届毕业生（官方页时间线）",
        source: "https://campus.qianxin.com/campus/graduates",
      },
    ],
  },
  {
    key: "h3c",
    name: "新华三",
    business: "数字化解决方案厂商（网络设备、云计算、ICT 整体方案）",
    directions: ["network", "cloud"],
    cities: ["杭州", "北京", "成都", "郑州"],
    interviewStyle: "售前技术工程师一面实录见来源链接",
    sources: [
      { title: "牛客·新华三 售前技术工程师 一面面经", url: "https://www.nowcoder.com/discuss/916380122108727296", kind: "interview" },
      { title: "新华三集团招聘·校招岗位", url: "https://career.h3c.com/campus/jobs", kind: "official" },
      { title: "高校就业网转载·新华三(H3C)2027届校园招聘", url: "https://lzpu.bysjy.com.cn/detail/online?id=3538443", kind: "repost" },
    ],
    careerUrl: "https://career.h3c.com/campus/jobs",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      { year: 2027, note: "2027 届校招进行中（高校就业网转载，岗位详情以官网为准）", source: "https://lzpu.bysjy.com.cn/detail/online?id=3538443" },
    ],
  },
  {
    key: "nsfocus",
    name: "绿盟科技",
    business: "网络安全厂商（安全产品与安全服务）",
    directions: ["security"],
    cities: ["北京", "成都", "广州", "武汉"],
    sources: [
      { title: "绿盟科技 2027 校园招聘官网（含完整时间线）", url: "https://www.nsfocus.com.cn/campus/1_1.html", kind: "official" },
      { title: "绿盟科技网申入口（Moka 系统）", url: "https://app.mokahr.com/campus_apply/nsfocus/29118", kind: "official" },
    ],
    careerUrl: "https://www.nsfocus.com.cn/campus/1_1.html",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      {
        year: 2027,
        batches: ["网申投递 2026-07-28 至 11 月下旬", "在线笔试 8 月中旬起多批次", "面试 2-3 轮（现场/在线视频）", "OFFER 9 月上旬起", "2027 年 7 月后办理入职"],
        note: "面向 2027 届（2026.10-2027.7 毕业生），部分岗位 26 届可投（官方页时间线）",
        source: "https://www.nsfocus.com.cn/campus/1_1.html",
      },
    ],
  },
  {
    key: "huawei",
    name: "华为",
    business: "ICT 基础设施与终端巨头（云/网络/存储，售前与解决方案体系最成熟）",
    directions: ["cloud", "network", "hardware"],
    cities: ["深圳", "北京", "南京", "成都", "西安", "杭州"],
    sources: [
      { title: "华为招聘官网", url: "https://career.huawei.com/cn", kind: "official" },
    ],
    careerUrl: "https://career.huawei.com/cn",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "unknown",
  },
  {
    key: "tencent",
    name: "腾讯（腾讯云解决方案方向）",
    business: "互联网大厂，腾讯云解决方案/售前岗位走统一校招入口",
    directions: ["cloud"],
    cities: ["深圳", "北京", "上海", "广州"],
    interviewStyle: "解决方案方向面经见来源链接",
    sources: [
      { title: "知乎·腾讯面经-解决方案架构师", url: "https://zhuanlan.zhihu.com/p/461715424", kind: "interview" },
      { title: "腾讯校招官网", url: "https://join.qq.com/", kind: "official" },
    ],
    careerUrl: "https://join.qq.com/",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "unknown",
  },
  {
    key: "zte",
    name: "中兴通讯",
    business: "综合通信解决方案提供商（“连接+算力”战略，网络/算力/终端全栈）",
    directions: ["network", "cloud", "hardware"],
    cities: ["深圳", "北京", "南京", "西安", "成都"],
    sources: [
      { title: "中兴通讯招聘官网", url: "https://job.zte.com.cn/cn/", kind: "official" },
      { title: "中兴通讯2027届秋季校园招聘正式启动（官网新闻，2026-08-31）", url: "https://job.zte.com.cn/content/zte-job/cn/campus-recruitment/School_Recruitment_Announcement/news/2023.html", kind: "official" },
    ],
    careerUrl: "https://job.zte.com.cn/content/zte-job/cn/campus-recruitment/Recruitment_positions/freshstudent.html",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      { year: 2027, note: "2027 届秋季校园招聘 2026-08-31 官网官宣启动；营销类含客户经理/MKT经理（技术）等售前相邻岗位", source: "https://job.zte.com.cn/content/zte-job/cn/campus-recruitment/School_Recruitment_Announcement/news/2023.html" },
    ],
  },
  {
    key: "lenovo",
    name: "联想",
    business: "ICT 设备与智能解决方案厂商（售前方案顾问岗位有完整公开面经）",
    directions: ["hardware", "software"],
    cities: ["北京", "天津", "深圳", "上海", "武汉", "成都"],
    interviewStyle: "售前方案顾问岗有完整面经（含 offer），见来源链接",
    sources: [
      { title: "牛客·联想23秋招 售前方案顾问面经", url: "https://www.nowcoder.com/discuss/411181388249014272", kind: "interview" },
      { title: "联想校园招聘官网", url: "https://talent.lenovo.com.cn/home", kind: "official" },
      { title: "四川美院学生处转载·联想中国2027届秋招全面启动（含网申时间线）", url: "https://www.scfai.edu.cn/xsc/info/1015/20072.htm", kind: "repost" },
    ],
    careerUrl: "https://talent.lenovo.com.cn/home",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      { year: 2027, batches: ["网申 2026-08-05 至 11-13", "测评（筛选通过后 3 日内）", "offer 9 月起陆续发放"], note: "面向 2027 届海内外毕业生；岗位含市场与销售类", source: "https://www.scfai.edu.cn/xsc/info/1015/20072.htm" },
    ],
  },
  {
    key: "alibaba",
    name: "阿里巴巴（阿里云解决方案方向）",
    business: "互联网大厂，阿里云设解决方案架构师/售前岗位体系",
    directions: ["cloud", "data"],
    cities: ["杭州", "北京", "上海", "深圳"],
    sources: [
      { title: "阿里巴巴招聘官网（campus.alibaba.com 跳转至此）", url: "https://talent.alibaba.com", kind: "official" },
      { title: "兰州大学就业网转载·阿里巴巴2027届应届生招聘全球启动", url: "https://job.lzu.edu.cn/html/22/article/2026/90608.html", kind: "repost" },
    ],
    careerUrl: "https://talent.alibaba.com",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      { year: 2027, note: "2027 届应届生招聘全球启动（高校就业网转载，岗位以官网为准）", source: "https://job.lzu.edu.cn/html/22/article/2026/90608.html" },
    ],
  },
  {
    key: "jd",
    name: "京东（京东云解决方案方向）",
    business: "互联网大厂，京东云/零售技术设解决方案类岗位",
    directions: ["cloud", "software"],
    cities: ["北京", "上海", "深圳", "成都"],
    sources: [
      { title: "京东校招官网", url: "https://campus.jd.com/", kind: "official" },
      { title: "山东省就业网转载·京东2027校园招聘全面启动", url: "https://html.gxjy.sdei.edu.cn//html/2026/08/03/207156.html", kind: "repost" },
    ],
    careerUrl: "https://campus.jd.com/",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      { year: 2027, note: "2027 校园招聘全面启动（2026-08 转载来源）", source: "https://html.gxjy.sdei.edu.cn//html/2026/08/03/207156.html" },
    ],
  },
  {
    key: "bytedance",
    name: "字节跳动（火山引擎方向）",
    business: "互联网大厂，火山引擎（云与 AI 服务）设解决方案/售前类岗位",
    directions: ["cloud"],
    cities: ["北京", "上海", "深圳", "杭州"],
    sources: [
      { title: "字节跳动校招官网", url: "https://jobs.bytedance.com/campus", kind: "official" },
    ],
    careerUrl: "https://jobs.bytedance.com/campus",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "unknown",
  },
  {
    key: "baidu",
    name: "百度（百度智能云方向）",
    business: "互联网大厂，百度智能云设解决方案岗位体系",
    directions: ["cloud", "data"],
    cities: ["北京", "上海", "深圳"],
    sources: [
      { title: "百度招聘官网·校招入口", url: "https://talent.baidu.com/campus/index", kind: "official" },
      { title: "南开大学就业网代发·百度2027届校园招聘", url: "https://career.nankai.edu.cn/correcruit/content/id/118329.html", kind: "repost" },
    ],
    careerUrl: "https://talent.baidu.com/campus/index",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      { year: 2027, note: "2027 届校园招聘已启动（高校就业网代发）", source: "https://career.nankai.edu.cn/correcruit/content/id/118329.html" },
    ],
  },
  {
    key: "ctyun",
    name: "天翼云（中国电信）",
    business: "中国电信旗下云服务商（国家云：云计算/大数据/AI 基础设施）",
    directions: ["cloud"],
    cities: ["北京", "上海", "广州", "深圳", "成都", "厦门"],
    sources: [
      { title: "中国科大就业网·中国电信天翼云2027届校园招聘", url: "https://www.job.ustc.edu.cn/Recruitment/info.aspx?itemid=76756", kind: "repost" },
      { title: "深圳本地宝·天翼云2027届校招汇总（含官方投递入口）", url: "http://sz.bendibao.com/job/202686/1009509.shtm", kind: "repost" },
    ],
    careerUrl: "https://ctyun.hotjob.cn",
    careerUrlVerified: false,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      { year: 2027, batches: ["网申-简历筛选-笔试-面试-综合测评-意向沟通-签约"], note: "面向海内外 2027 届；42 岗位含云鹰管培生（市场方向）；投递入口 ctyun.hotjob.cn（系统反爬，浏览器可正常访问）", source: "http://sz.bendibao.com/job/202686/1009509.shtm" },
    ],
  },
  {
    key: "asiainfo-sec",
    name: "亚信安全",
    business: "网络安全厂商（威胁检测与安全服务，运营商安全市场）",
    directions: ["security"],
    cities: ["南京", "北京"],
    sources: [
      { title: "亚信安全校招官网（飞书招聘页）", url: "https://asiainfo-sec.jobs.feishu.cn/campus/", kind: "official" },
    ],
    careerUrl: "https://asiainfo-sec.jobs.feishu.cn/campus/",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "unknown",
  },
  {
    key: "hikvision",
    name: "海康威视",
    business: "智能物联（安防）解决方案厂商，行业解决方案体系庞大",
    directions: ["hardware", "software"],
    cities: ["杭州", "北京", "上海", "成都"],
    sources: [
      { title: "海康威视校招官网", url: "https://campushr.hikvision.com", kind: "official" },
      { title: "南开大学就业网·海康威视2027校园招聘火热招聘中", url: "https://career.nankai.edu.cn/correcruit/content/id/118370.html", kind: "repost" },
    ],
    careerUrl: "https://campushr.hikvision.com",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      { year: 2027, note: "2027 校园招聘进行中（高校就业网转载）", source: "https://career.nankai.edu.cn/correcruit/content/id/118370.html" },
    ],
  },
  {
    key: "iflytek",
    name: "科大讯飞",
    business: "智能语音与人工智能厂商（教育/医疗/运营商行业解决方案）",
    directions: ["software", "data"],
    cities: ["合肥", "北京", "上海"],
    sources: [
      { title: "科大讯飞招聘官网（campus.iflytek.com 跳转至此）", url: "https://iflytek.zhiye.com", kind: "official" },
      { title: "深圳北理莫斯科大学就业网·科大讯飞2027届非凡计划校园招聘", url: "https://career.smbu.edu.cn/detail/online?id=3534908", kind: "repost" },
    ],
    careerUrl: "https://iflytek.zhiye.com",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "open",
    hiringHistory: [
      { year: 2027, note: "2027 届非凡计划校园招聘已启动（高校就业网转载）", source: "https://career.smbu.edu.cn/detail/online?id=3534908" },
    ],
  },
  {
    key: "netease",
    name: "网易（网易数帆方向）",
    business: "互联网公司，网易数帆设企业级解决方案类岗位",
    directions: ["software", "cloud"],
    cities: ["杭州", "广州", "北京"],
    sources: [
      { title: "网易校招官网", url: "https://campus.163.com/", kind: "official" },
    ],
    careerUrl: "https://campus.163.com/",
    careerUrlVerified: true,
    verifiedAt: "2026-09-10",
    status: "unknown",
  },
];
