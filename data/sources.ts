export interface SourceItem {
  title: string;
  url: string;
  note: string;
}

export interface SourceCategory {
  key: string;
  title: string;
  emoji: string;
  items: SourceItem[];
}

/**
 * 资料库：从公开网络整理的售前/秋招学习链接。
 * 注意：链接为检索所得（2026-09-04），个别可能失效或需登录，以实际页面为准。
 */
export const SOURCES: SourceCategory[] = [
  {
    key: "interview",
    title: "面经与求职",
    emoji: "🎯",
    items: [
      {
        title: "牛客·本科小白的秋招～深信服面经",
        url: "https://www.nowcoder.com/discuss/353158894593712128",
        note: "售前岗真实面经，可看流程与问题",
      },
      {
        title: "牛客·深信服售前面经（9.27 已 offer）",
        url: "https://www.nowcoder.com/feed/main/detail/25376d26532c47c1b4fb1292acd1cecd",
        note: "售前 offer 面经",
      },
      {
        title: "校招VIP·深信服产品面经",
        url: "https://xiaozhao.vip/article/detail/5318",
        note: "产品/售前方向面经",
      },
      {
        title: "牛客·奇安信 售前工程师面经（已 offer）",
        url: "https://www.nowcoder.com/discuss/353158415927156736",
        note: "安全厂商售前面经",
      },
      {
        title: "牛客·联想23秋招 售前方案顾问面经",
        url: "https://www.nowcoder.com/discuss/411181388249014272",
        note: "方案顾问方向面经",
      },
      {
        title: "牛客·新华三 售前技术工程师 一面面经",
        url: "https://www.nowcoder.com/discuss/916380122108727296",
        note: "一面实录",
      },
      {
        title: "博客园·常见的售前面试题",
        url: "https://www.cnblogs.com/gen2122/p/15950876.html",
        note: "售前面试题合集",
      },
      {
        title: "知乎·腾讯面经-解决方案架构师",
        url: "https://zhuanlan.zhihu.com/p/461715424",
        note: "解决方案方向面经",
      },
    ],
  },
  {
    key: "resume",
    title: "简历与自我介绍",
    emoji: "📄",
    items: [
      {
        title: "应届毕业生网·售前工程师岗位个人简历怎么写",
        url: "http://www.369993.com/d305265.html",
        note: "简历写法与范文",
      },
      {
        title: "简历范文网·售前技术支持工程师简历范文（ToB/智能制造校招）",
        url: "https://upjianli.com/jianlifanwen/2577.html",
        note: "ToB/智能制造校招范文",
      },
      {
        title: "简历本·售前工程师自我评价简历范文",
        url: "https://www.jianliben.com/article/detail/37826",
        note: "自我评价写法",
      },
    ],
  },
  {
    key: "method",
    title: "岗位认知与方法论",
    emoji: "🧠",
    items: [
      {
        title: "知乎·售前是项目开展的排头兵",
        url: "https://zhuanlan.zhihu.com/p/630304327",
        note: "售前岗位认知",
      },
      {
        title: "知乎·（三）售前技能图谱：IT 售前需要哪些技能",
        url: "https://zhuanlan.zhihu.com/p/67576161",
        note: "售前技能体系",
      },
      {
        title: "博客园·00-售前基本素质",
        url: "https://www.cnblogs.com/routeswitch/articles/18255110",
        note: "售前基本素质",
      },
      {
        title: "ProcessOn·售前基本流程与内容（持续迭代更新）",
        url: "https://www.processon.com/view/63e1b0cc2a93473cd87c67f1",
        note: "售前工作流程脑图",
      },
      {
        title: "清华大学出版社《IT售前工程师修炼之道》",
        url: "https://baike.baidu.com/item/IT%E5%94%AE%E5%89%8D%E5%B7%A5%E7%A8%8B%E5%B8%88%E4%BF%AE%E7%82%BC%E4%B9%8B%E9%81%93",
        note: "入门图书（百科页）",
      },
      {
        title: "百度百科《一本书讲透IT售前》",
        url: "https://baike.baidu.com/item/%E4%B8%80%E6%9C%AC%E4%B9%A6%E8%AE%B2%E9%80%8FIT%E5%94%AE%E5%89%8D/62982101",
        note: "2023 机械工业出版社",
      },
      {
        title: "QQ阅读《从零开始做IT售前工程师》",
        url: "https://book.qq.com/book-read/40778343/6",
        note: "在线试读",
      },
    ],
  },
  {
    key: "solution",
    title: "需求、方案与产出物",
    emoji: "🧩",
    items: [
      {
        title: "CSDN·售前屠龙刀·售前需求探寻与调研方法（上）",
        url: "https://edu.csdn.net/learn/28827/489733",
        note: "需求调研视频课",
      },
      {
        title: "TO B 销售基本功·从拜访到成交四部曲",
        url: "https://www.wescrm.com/siyuzhishiku/siyuyunying/5802.html",
        note: "拜访方法论",
      },
      {
        title: "搜文档·IT 售前项目工作流程 SOP",
        url: "https://www.renrendoc.com/paper/461573168.html",
        note: "SOP 文档",
      },
      {
        title: "51CTO·售前必看：如何打造无懈可击的防御性解决方案",
        url: "https://blog.51cto.com/u_11226567/13444081",
        note: "防御性方案思路",
      },
      {
        title: "帆软博客·竞品调研分析怎么做效果更好",
        url: "https://www.finebi.com/blog/article/69d06e8ebc3caea587961a72",
        note: "竞品分析方法",
      },
      {
        title: "尚斌·云+网+X+端 需求洞察与差异化方案制定",
        url: "https://www.zms.org.cn/yx_kg/7874.html",
        note: "差异化方案",
      },
      {
        title: "腾讯云开发者·万字长文教你制作 IT 项目售前解决方案",
        url: "https://cloud.tencent.cn/developer/article/2238218",
        note: "方案书写作长文",
      },
      {
        title: "网易号·如何根据需求，写出一份好的 PPT 解决方案？",
        url: "https://www.163.com/dy/article/FR5PN3CD0511805E.html",
        note: "PPT 方案写法",
      },
      {
        title: "ERP 售前不规范，实施两行泪",
        url: "https://articles.e-works.net.cn/erp/article149514.htm",
        note: "售前规范反面教材",
      },
    ],
  },
  {
    key: "tender",
    title: "招投标与讲标",
    emoji: "🏛️",
    items: [
      {
        title: "CSDN·售前屠龙刀·应标讲标方法与步骤",
        url: "https://edu.csdn.net/learn/28827/580064",
        note: "正式讲标方法",
      },
      {
        title: "ProcessOn·《从零开始做IT售前工程师》讲标读书笔记",
        url: "https://www.processon.com/view/641403e633b841415cc4f9e4",
        note: "讲标 PPT 结构笔记",
      },
      {
        title: "百度文库·投标讲标要点样本",
        url: "https://wenku.baidu.com/view/ba57350bb94cf7ec4afe04a1b0717fd5370cb265.html",
        note: "讲标要点",
      },
    ],
  },
  {
    key: "tech",
    title: "技术与云",
    emoji: "🛰️",
    items: [
      {
        title: "华为云社区·一文搞懂 SaaS、PaaS、IaaS 的概念和异同",
        url: "https://bbs.huaweicloud.com/blogs/380525",
        note: "云分层入门",
      },
      {
        title: "阿里云开发者·什么是 IaaS, PaaS, SaaS？",
        url: "https://developer.aliyun.com/article/1620167",
        note: "云分层入门",
      },
      {
        title: "阿里云开发者·阿里云发布《云采用框架白皮书》",
        url: "https://developer.aliyun.com/article/785340",
        note: "上云方法论白皮书",
      },
      {
        title: "腾讯云·《分布式云行业实践指南》",
        url: "https://cloud.tencent.cn/developer/article/2302597",
        note: "行业实践指南",
      },
      {
        title: "TechRepublic·免费白皮书库",
        url: "https://www.techrepublic.com/resource-library/content-type/whitepapers/272",
        note: "英文白皮书资源",
      },
    ],
  },
  {
    key: "soft",
    title: "表达与商务",
    emoji: "💬",
    items: [
      {
        title: "售前工程师的成长——一个老员工的经验之谈",
        url: "https://www.e-com-net.com/article/3104519.htm",
        note: "售前经验谈",
      },
      {
        title: "价值为王·超级售前训练（沟通与价值呈现）",
        url: "https://www.zms.org.cn/yx_kg/16211.html",
        note: "售前训练课程页",
      },
      {
        title: "Zoho CRM·报价、合同与回款管理功能解析",
        url: "https://zdblogs.zoho.com.cn/crm/articles/contract260528.html",
        note: "商务流程参考",
      },
      {
        title: "销售流程标准动作：报价→订单→发货→回款",
        url: "https://www.caohaifeng.com/jinxiaocun/sales-process-standard/",
        note: "销售流程参考",
      },
    ],
  },
  {
    key: "career",
    title: "职业发展与课程",
    emoji: "🧭",
    items: [
      {
        title: "V2EX·4 年 Java 后端转售前，有成功的老哥吗？",
        url: "https://global.v2ex.co/t/1174063",
        note: "转售前讨论",
      },
      {
        title: "51CTO 学院·专业售前工程师实战宝典（从入门到精通）",
        url: "https://edu.51cto.com/course/34274.html",
        note: "系统课程（付费）",
      },
      {
        title: "CSDN 教育·售前屠龙刀-售前高手技能精进",
        url: "https://edu.csdn.net/learn/28827/533226",
        note: "系统课程（付费）",
      },
      {
        title: "B 站课堂·IT 售前解决方案之从小白到专家",
        url: "https://www.bilibili.com/cheese/play/ss988024390",
        note: "视频课",
      },
    ],
  },
];
