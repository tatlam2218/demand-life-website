// ============ Default contract / legal text ============
// Concise, professional Hong Kong monthly tenancy template.
// All occurrences of {{placeholder}} will be replaced before rendering.

const DEFAULT_CONTRACT_EN = `<h1>Tenancy Agreement</h1>
<p class="contract-meta">Contract No. {{contractNumber}} · Booking {{bookingId}} · Date {{contractDate}}</p>

<h2>1. Parties</h2>
<p><strong>Landlord:</strong> {{landlordName}}, of {{landlordAddress}}, represented by {{landlordRep}}.<br>
<strong>Tenant:</strong> {{name}} ({{nameChinese}}), holder of {{idType}} no. {{idNumber}}, nationality {{nationality}}, date of birth {{dateOfBirth}}, currently residing at {{currentAddress}}.</p>

<h2>2. Premises</h2>
<p>The Landlord lets to the Tenant a {{roomType}} room (the &ldquo;Premises&rdquo;) at Demain Life, Demain@1331, Kai Tak, Kowloon, Hong Kong, for residential use only, for a maximum occupancy of {{occupancy}} person(s).</p>

<h2>3. Term</h2>
<p>The tenancy shall commence on <strong>{{moveInDate}}</strong> and expire on <strong>{{moveOutDate}}</strong>, being a term of {{duration}}.</p>

<h2>4. Rent</h2>
<p>The monthly rent shall be <strong>HK$ {{roomPrice}}</strong>, payable in advance on or before the first day of each calendar month, by FPS, bank transfer or such other method as the Landlord may designate.</p>

<h2>5. Deposit</h2>
<p>Upon signing this Agreement the Tenant shall pay a security deposit of <strong>HK$ {{depositAmount}}</strong> (being {{depositMonths}} month(s) rent) and the first month&rsquo;s rent of <strong>HK$ {{firstMonthRent}}</strong>, totalling <strong>HK$ {{totalPrepayment}}</strong>. The deposit shall be refunded within 30 days after the end of the tenancy, less any sum properly deducted for unpaid rent, utilities or damage beyond fair wear and tear.</p>

<h2>6. Utilities & Services</h2>
<p>Water, basic electricity (capped at HK$ 300/month) and Wi-Fi are included in the rent. Excess electricity, additional services or breakages shall be charged to the Tenant at cost.</p>

<h2>7. House Rules</h2>
<p>The Tenant shall observe the Demain Life House Rules (as may be amended from time to time), including no smoking, no pets, no sub-letting, and respect for shared facilities and neighbours. Quiet hours are 22:00&ndash;08:00.</p>

<h2>8. Early Termination</h2>
<p>Either party may terminate this Agreement by giving one month&rsquo;s written notice after the first three months. Termination during the first three months shall entitle the Landlord to forfeit one month&rsquo;s rent from the deposit.</p>

<h2>9. Personal Data</h2>
<p>The Tenant consents to the Landlord processing the personal data provided under this Agreement for the purpose of administering the tenancy, in accordance with the Personal Data (Privacy) Ordinance (Cap. 486) and the Landlord&rsquo;s Privacy Policy.</p>

<h2>10. Governing Law</h2>
<p>This Agreement shall be governed by the laws of the Hong Kong Special Administrative Region.</p>

<h2>11. Emergency Contact</h2>
<p>The Tenant nominates as emergency contact: <strong>{{emergencyName}}</strong> ({{emergencyRelation}}), phone {{emergencyPhone}}.</p>

<p class="contract-closing">By signing below the Tenant acknowledges having read, understood and agreed to all terms of this Agreement.</p>`

const DEFAULT_CONTRACT_ZH_CN = `<h1>租赁合同</h1>
<p class="contract-meta">合同号 {{contractNumber}} · 订单 {{bookingId}} · 日期 {{contractDate}}</p>

<h2>一、双方当事人</h2>
<p><strong>出租人：</strong>{{landlordName}}，地址{{landlordAddress}}，代表人{{landlordRep}}。<br>
<strong>承租人：</strong>{{name}}（{{nameChinese}}），{{idType}}号码{{idNumber}}，国籍{{nationality}}，出生日期{{dateOfBirth}}，现住址{{currentAddress}}。</p>

<h2>二、租赁房屋</h2>
<p>出租人将位于香港九龙启德Demain Life (Demain@1331) 的一间{{roomType}}房型（以下简称“租赁物业”）出租于承租人仅作住宅用途，最多入住{{occupancy}}人。</p>

<h2>三、租期</h2>
<p>租期自<strong>{{moveInDate}}</strong>起至<strong>{{moveOutDate}}</strong>止，共{{duration}}。</p>

<h2>四、租金</h2>
<p>月租金为<strong>港币 {{roomPrice}}</strong>，于每个日历月首日或之前以FPS、银行转账或出租人指定之其他方式预付。</p>

<h2>五、押金与首付</h2>
<p>承租人于签约时需支付保证金<strong>港币 {{depositAmount}}</strong>（即{{depositMonths}}个月租金）及首月租金<strong>港币 {{firstMonthRent}}</strong>，总计<strong>港币 {{totalPrepayment}}</strong>。保证金应于租期终止后30日内退还，扭除拖欠租金、公事费及超出正常使用损耗。</p>

<h2>六、公事与服务</h2>
<p>租金包含水费、基本电费（每月10港元则计以港币300元为上限）及无线网络。超额电费、附加服务及损坏需承租人按实费支付。</p>

<h2>七、入住规则</h2>
<p>承租人需遵守Demain Life入住规则（可不时修订），包括禁烟、禁养宠物、禁转租、尊重公共设施及邻居。清静时间为晚22点至次日8点。</p>

<h2>八、提前退租</h2>
<p>双方可于租期满3个月后凭一个月书面通知终止本合同。前3个月内终止者，出租人可从保证金中扣除一个月租金。</p>

<h2>九、个人信息</h2>
<p>承租人同意出租人为管理租约之目的处理本合同提供的个人资料，遵循【个人资料（私隐）条例】（香港法例第486章）及出租人隐私政策。</p>

<h2>十、适用法律</h2>
<p>本合同受香港特别行政区法律管辖。</p>

<h2>十一、紧急联系人</h2>
<p>承租人指定之紧急联系人：<strong>{{emergencyName}}</strong>（{{emergencyRelation}}），电话{{emergencyPhone}}。</p>

<p class="contract-closing">承租人签名即确认已阅读、理解并同意本合同之全部条款。</p>`

const DEFAULT_CONTRACT_ZH_HK = `<h1>租賃合約</h1>
<p class="contract-meta">合約號 {{contractNumber}} · 訂單 {{bookingId}} · 日期 {{contractDate}}</p>

<h2>一、雙方當事人</h2>
<p><strong>出租人：</strong>{{landlordName}}，地址{{landlordAddress}}，代表人{{landlordRep}}。<br>
<strong>承租人：</strong>{{name}}（{{nameChinese}}），{{idType}}號碼{{idNumber}}，國籍{{nationality}}，出生日期{{dateOfBirth}}，現住址{{currentAddress}}。</p>

<h2>二、租賃物業</h2>
<p>出租人將位於香港九龍啟德Demain Life (Demain@1331) 的一間{{roomType}}房型（以下簡稱「租賃物業」）出租於承租人僅作住宅用途，最多入住{{occupancy}}人。</p>

<h2>三、租期</h2>
<p>租期自<strong>{{moveInDate}}</strong>起至<strong>{{moveOutDate}}</strong>止，共{{duration}}。</p>

<h2>四、租金</h2>
<p>月租金為<strong>港幣 {{roomPrice}}</strong>，於每個日曆月首日或之前以FPS、銀行轉賬或出租人指定之其他方式預付。</p>

<h2>五、押金與首付</h2>
<p>承租人於簽約時需支付保證金<strong>港幣 {{depositAmount}}</strong>（即{{depositMonths}}個月租金）及首月租金<strong>港幣 {{firstMonthRent}}</strong>，總計<strong>港幣 {{totalPrepayment}}</strong>。保證金應於租期終止後30日內退還，扝除拖欠租金、公事費及超出正常使用損耗。</p>

<h2>六、公事與服務</h2>
<p>租金包含水費、基本電費（每月10港元則計以港幣300元為上限）及無線網路。超額電費、附加服務及損壞需承租人按實費支付。</p>

<h2>七、入住規則</h2>
<p>承租人須遵守Demain Life入住規則（可不時修訂），包括禁煙、禁養寥物、禁轉租、尊重公共設施及鄰居。清靜時間為晚22點至次日8點。</p>

<h2>八、提前退租</h2>
<p>雙方可於租期满3個月後憑一個月書面通知終止本合約。前3個月內終止者，出租人可從保證金中扣除一個月租金。</p>

<h2>九、個人資料</h2>
<p>承租人同意出租人為管理租約之目的處理本合約提供的個人資料，遵循【個人資料（私隱）條例】（香港法例第486章）及出租人隱私政策。</p>

<h2>十、適用法律</h2>
<p>本合約受香港特別行政區法律管轄。</p>

<h2>十一、紧急聯絡人</h2>
<p>承租人指定之紧急聯絡人：<strong>{{emergencyName}}</strong>（{{emergencyRelation}}），電話{{emergencyPhone}}。</p>

<p class="contract-closing">承租人簽名即確認已閱讀、理解並同意本合約之全部條款。</p>`

// ============ Default house rules & privacy policy ============
const DEFAULT_TERMS_EN = `<h2>1. Conduct & community</h2>
<p>Demain Life is shared accommodation for postgraduates, researchers and founders. Residents are expected to treat staff, fellow residents and neighbours with respect. Harassment of any kind, illegal activity, and excessive noise are not tolerated.</p>
<h2>2. Quiet hours</h2>
<p>Quiet hours are 22:00&ndash;08:00. Please keep volumes low in shared corridors and lounges.</p>
<h2>3. Smoking, alcohol & substances</h2>
<p>Smoking (including e-cigarettes) is prohibited inside the building. Alcohol is permitted in moderation in private rooms only. Illegal drugs are strictly prohibited.</p>
<h2>4. Visitors</h2>
<p>Day visitors are welcome between 08:00 and 22:00. Overnight visitors require prior approval and may be subject to an additional fee.</p>
<h2>5. Pets</h2>
<p>No pets, except certified assistance animals with prior approval.</p>
<h2>6. Shared facilities</h2>
<p>Please clean up after using the kitchen, lounges and laundry rooms. Personal items left in shared areas may be moved by staff.</p>
<h2>7. Maintenance & safety</h2>
<p>Report damage or maintenance issues promptly via the resident app. Tampering with smoke detectors, locks or electrical wiring is strictly prohibited.</p>
<h2>8. Sub-letting & lock changes</h2>
<p>The Premises may not be sub-let, shared with non-listed occupants, or have its locks changed by the Tenant.</p>
<h2>9. Insurance</h2>
<p>Residents are encouraged to maintain their own personal contents insurance. Demain Life is not liable for loss or damage to personal property.</p>
<h2>10. Changes</h2>
<p>House Rules may be updated from time to time. Material changes will be communicated by email at least 30 days in advance.</p>`

const DEFAULT_TERMS_ZH_CN = `<h2>一、社区与行为准则</h2>
<p>Demain Life 是为研究生、研究人员与创业者提供的共享住宿。住客需以礼相待员工、邻居与其他住客。不容忍骚扰、违法行为及过量噪音。</p>
<h2>二、清静时间</h2>
<p>清静时间为晚22点至次日8点。走廊与公共区域请保持低声。</p>
<h2>三、烟酒及药物</h2>
<p>室内及公共区域一律禁烟（含电子烟）。酒类仅限个人房间内适量饮用。严禁非法药物。</p>
<h2>四、访客</h2>
<p>白天访客时间为08:00至22:00。过夜访客需提前审批，可能产生附加费用。</p>
<h2>五、宠物</h2>
<p>不允许宠物，例外仅限已审批的认证帮助动物。</p>
<h2>六、共享设施</h2>
<p>使用厨房、休息区与洗衣房后请自行清洁。赶不及取走之个人物品可能被工作人员移动。</p>
<h2>七、维修与安全</h2>
<p>请通过居民app及时报告损坏与维修需求。严禁人为破坏烟雾探测器、门锁及电路。</p>
<h2>八、转租与换锁</h2>
<p>租赁物业不得转租、不得与合同之外之人共住，承租人不得自行更换门锁。</p>
<h2>九、保险</h2>
<p>鼓励住客自行购买个人财物保险。Demain Life 不承担个人物品丢失或损坏责任。</p>
<h2>十、入住规则变更</h2>
<p>入住规则可不时修订。重大变更将提前30天以邮件通知住客。</p>`

const DEFAULT_TERMS_ZH_HK = `<h2>一、社區與行為準則</h2>
<p>Demain Life 是為研究生、研究人員與創業者提供的共享住宿。住客須以禮相待員工、鄰居與其他住客。不容忍騷擾、違法行為及過量噪音。</p>
<h2>二、清靜時間</h2>
<p>清靜時間為晚22點至次日8點。走廊與公共區域請保持低聲。</p>
<h2>三、煙酒及藥物</h2>
<p>室內及公共區域一律禁煙（含電子煙）。酒類僅限個人房間內適量飲用。嚴禁非法藥物。</p>
<h2>四、訪客</h2>
<p>白天訪客時間為08:00至22:00。過夜訪客須提前審批，可能產生附加費用。</p>
<h2>五、寥物</h2>
<p>不允許寥物，例外僅限已審批的認證幫助動物。</p>
<h2>六、共享設施</h2>
<p>使用廨房、休息區與洗衣房後請自行清潔。趕不及取走之個人物品可能被工作人員移動。</p>
<h2>七、維修與安全</h2>
<p>請透過居民app及時報告損壞與維修需求。嚴禁人為破壞煙霧探測器、門鎖及電路。</p>
<h2>八、轉租與換鎖</h2>
<p>租賃物業不得轉租、不得與合約之外之人共住，承租人不得自行更換門鎖。</p>
<h2>九、保險</h2>
<p>鼓勵住客自行購買個人財物保險。Demain Life 不承擔個人物品遺失或損壞責任。</p>
<h2>十、入住規則變更</h2>
<p>入住規則可不時修訂。重大變更將提前30天以電郵通知住客。</p>`

const DEFAULT_PRIVACY_EN = `<h2>1. Who we are</h2>
<p>Demain Culture Entertainment Limited (&ldquo;Demain Life&rdquo;, &ldquo;we&rdquo;) is the data controller for the personal information collected through this website and the tenancy process.</p>
<h2>2. What we collect</h2>
<p>We collect: contact details (name, email, phone), identity documents (HK ID, passport or PRC ID, including images), nationality, date of birth, occupation, current address, emergency contact details, payment information, and information generated during your stay (e.g. communications, incident reports).</p>
<h2>3. Why we collect it</h2>
<p>(a) To assess and process your tenancy application; (b) to verify your identity and right to occupy; (c) to administer the tenancy and provide services; (d) to comply with legal obligations under Hong Kong law; (e) to communicate with you about your stay; (f) to improve our services.</p>
<h2>4. AI assistance</h2>
<p>With your consent, identity document images are sent once to xAI&rsquo;s Grok Vision API for the sole purpose of extracting text fields to pre-fill your form. xAI states that submitted images are not retained for model training. You may opt out and complete the form manually.</p>
<h2>5. Where we store it</h2>
<p>Booking metadata is stored on Cloudflare KV (servers in the United States and Asia-Pacific). Identity documents and contracts are stored in Google Drive (servers under Google&rsquo;s standard terms). Emails are sent via Resend.</p>
<h2>6. Who we share with</h2>
<p>We do not sell your data. We share data only with: (a) Demain Life staff on a need-to-know basis; (b) processors listed in section 5 acting on our instructions; (c) regulatory or law-enforcement authorities where legally required.</p>
<h2>7. How long we keep it</h2>
<p>We retain booking records for 7 years after the end of your tenancy, in line with Hong Kong tax and tenancy retention norms. Identity document images are deleted within 30 days after move-out unless a longer period is required by law.</p>
<h2>8. Your rights</h2>
<p>Under the Personal Data (Privacy) Ordinance (Cap. 486) you have the right to access, correct, or request erasure of your personal data, subject to legal limits. To exercise these rights, email <a href="mailto:privacy@demainlife.com">privacy@demainlife.com</a>.</p>
<h2>9. Changes to this policy</h2>
<p>We may update this policy. Material changes will be notified by email at least 30 days in advance.</p>`

const DEFAULT_PRIVACY_ZH_CN = `<h2>一、我们是谁</h2>
<p>Demain Culture Entertainment Limited（以下简称“Demain Life”、“我们”）是本网站及租约流程中所收集个人资料的资料使用者。</p>
<h2>二、收集范围</h2>
<p>我们收集：联系资料（姓名、邮箱、电话）、身份证件（香港身份证、护照或中国居民身份证含图像）、国籍、出生日期、职业、现住址、紧急联系人、付款资讯，及入住期间产生之资讯（如沟通记录、事件报告）。</p>
<h2>三、收集目的</h2>
<p>（1）处理预订申请；（2）验证身份及入住资格；（3）管理租约及提供服务；（4）遵守香港法例之法定义务；（5）就您的入住与您沟通；（6）改进服务。</p>
<h2>四、AI 辅助</h2>
<p>经您同意，身份证件图像将一次性发送至 xAI 的 Grok Vision API，仅用于提取文本以预填表单。xAI 表示不会保留提交之图像用于模型训练。您可拒绝 AI 识别并手动填写。</p>
<h2>五、存储位置</h2>
<p>预订资料存于 Cloudflare KV（服务器位于美国及亚太区）。身份证件及合同存于 Google Drive（服务器遵循 Google 标准条款）。邮件由 Resend 发送。</p>
<h2>六、分享对象</h2>
<p>我们不出售您的个人资料。我们仅于下列类别人士分享：（1）需要知悉之Demain Life 员工；（2）第五条所列的处理者；（3）法律所要求之监管机构或执法机关。</p>
<h2>七、保留期</h2>
<p>预订记录保留至租期终止后7年，符合香港税务及租赁保留规则。身份证件图像将在退租后30日内删除，除非法例要求更长。</p>
<h2>八、您的权利</h2>
<p>根据【个人资料（私隐）条例】（香港法例第486章），您有权查阅、更正或请求删除个人资料（受法律限制）。欲行使该等权利，请发邮至 <a href="mailto:privacy@demainlife.com">privacy@demainlife.com</a>。</p>
<h2>九、政策变更</h2>
<p>我们可能不时更新此政策。重大变更将提前30天以邮件通知。</p>`

const DEFAULT_PRIVACY_ZH_HK = `<h2>一、我們是誰</h2>
<p>Demain Culture Entertainment Limited（以下簡稱「Demain Life」、「我們」）是本網站及租約流程中所收集個人資料的資料使用者。</p>
<h2>二、收集範圍</h2>
<p>我們收集：聯絡資料（姓名、電郵、電話）、身份證件（香港身份證、護照或中國居民身份證含圖像）、國籍、出生日期、職業、現住址、紧急聯絡人、付款資訊，及入住期間產生之資訊（如溝通記錄、事件報告）。</p>
<h2>三、收集目的</h2>
<p>（1）處理預訂申請；（2）驗證身份及入住資格；（3）管理租約及提供服務；（4）遵守香港法例之法定義務；（5）就您的入住與您溝通；（6）改進服務。</p>
<h2>四、AI 輔助</h2>
<p>經您同意，身份證件圖像將一次性傳送至 xAI 的 Grok Vision API，僅用於提取文字以預填表單。xAI 表示不會保留提交之圖像用於模型訓練。您可拒絕 AI 辨識並手動填寫。</p>
<h2>五、儲存位置</h2>
<p>預訂資料存於 Cloudflare KV（伺服器位於美國及亞太區）。身份證件及合約存於 Google Drive（伺服器遵循 Google 標準條款）。電郵由 Resend 發送。</p>
<h2>六、分享對象</h2>
<p>我們不出售您的個人資料。我們僅於下列類別人士分享：（1）需要知悈之 Demain Life 員工；（2）第五條所列的處理者；（3）法律所要求之監管機構或執法機關。</p>
<h2>七、保留期</h2>
<p>預訂記錄保留至租期終止後7年，符合香港稅務及租賃保留規則。身份證件圖像將在退租後30日內刪除，除非法例要求更長。</p>
<h2>八、您的權利</h2>
<p>根據【個人資料（私隱）條例】（香港法例第486章），您有權查閱、更正或請求刪除個人資料（受法律限制）。欲行使該等權利，請發電郵至 <a href="mailto:privacy@demainlife.com">privacy@demainlife.com</a>。</p>
<h2>九、政策變更</h2>
<p>我們可能不時更新此政策。重大變更將提前30天以電郵通知。</p>`

export const defaultSiteData = {
  version: 1,
  updatedAt: new Date('2026-06-27T00:00:00Z').toISOString(),
  navigation: {
    translations: {
      en: { about: 'About', contact: 'Contact', admin: 'Admin' },
      'zh-CN': { about: '关于', contact: '联系', admin: '后台' },
      'zh-HK': { about: '關於', contact: '聯絡', admin: '後台' }
    }
  },
  swipe: {
    translations: {
      en: { stay: 'Stay', shop: 'Shop' },
      'zh-CN': { stay: '住宿', shop: '商店' },
      'zh-HK': { stay: '住宿', shop: '商店' }
    }
  },
  hotel: {
    primaryLanguage: 'en',
    heroImages: [
      '/hero-punk/hero1.webp',
      '/hero-punk/hero2.webp',
      '/hero-punk/hero3.webp'
    ],
    translations: {
      en: {
        eyebrow: 'Demain Life · Hong Kong',
        heroTitle1: 'A new way',
        heroTitle2: 'to live in',
        heroTitle3: 'Hong Kong.',
        heroSub1: 'Five hundred and six rooms.',
        heroSub2: 'One quiet philosophy of living.',
        metaRooms: 'Rooms',
        metaTypes: 'Room types',
        metaLocation: 'Location',
        locationName: 'Kowloon',
        spacesEyebrow: 'Our Spaces',
        spacesTitle1: 'Two room types.',
        spacesTitle2: 'One quiet aesthetic.',
        facilities: 'Facilities',
        bookNow: 'Book Now',
        priceNote: 'Final pricing & discounts will be confirmed by our team upon enquiry.',
        ctaEyebrow: 'Begin your stay',
        ctaTitle: 'Ready to reserve?',
        ctaSub: 'Tell us a little about your stay and our team will follow up within one business day.',
        ctaButton: 'Start a Reservation'
      },
      'zh-CN': {
        eyebrow: 'Demain Life · 香港',
        heroTitle1: '一种新的',
        heroTitle2: '香港居住',
        heroTitle3: '方式。',
        heroSub1: '五百零六间房。',
        heroSub2: '一种安静的生活哲学。',
        metaRooms: '房间',
        metaTypes: '房型',
        metaLocation: '位置',
        locationName: '九龙',
        spacesEyebrow: '居住空间',
        spacesTitle1: '两种房型。',
        spacesTitle2: '一种安静美学。',
        facilities: '配套设施',
        bookNow: '立即预订',
        priceNote: '具体价格与优惠将由团队在咨询后与您确认。',
        ctaEyebrow: '开始入住',
        ctaTitle: '准备预订了吗？',
        ctaSub: '告诉我们你的入住需求，我们会在一个工作日内与您联系。',
        ctaButton: '开始预约'
      },
      'zh-HK': {
        eyebrow: 'Demain Life · 香港',
        heroTitle1: '一種新的',
        heroTitle2: '香港居住',
        heroTitle3: '方式。',
        heroSub1: '五百零六間房。',
        heroSub2: '一種安靜的生活哲學。',
        metaRooms: '房間',
        metaTypes: '房型',
        metaLocation: '位置',
        locationName: '九龍',
        spacesEyebrow: '居住空間',
        spacesTitle1: '兩種房型。',
        spacesTitle2: '一種安靜美學。',
        facilities: '配套設施',
        bookNow: '立即預訂',
        priceNote: '具體價格與優惠將由團隊在查詢後與你確認。',
        ctaEyebrow: '開始入住',
        ctaTitle: '準備預訂了嗎？',
        ctaSub: '告訴我們你的入住需求，我們會在一個工作日內與你聯絡。',
        ctaButton: '開始預約'
      }
    }
  },
  lifeHere: {
    primaryLanguage: 'en',
    heroImages: [],
    translations: {
      en: {
        eyebrow: 'Life Here',
        title1: 'A neighbourhood,',
        title2: 'not just a building.',
        description: 'From aerial dusk over Kai Tak to skaters carving the courtyard at sunset — Demain@1331 is a living block, designed around its residents.'
      },
      'zh-HK': {
        eyebrow: '在這裡生活',
        title1: '一個社區，',
        title2: '而不只是一棟建築。',
        description: '從啟德 1331 的黃昏鳥瞰，到黃昏內陣裡滑板少年的身影——Demain@1331 是一個為居民而設計的生活街區。'
      },
      'zh-CN': {
        eyebrow: '在这里生活',
        title1: '一个社区，',
        title2: '而不只是一栋建筑。',
        description: '从启德 1331 的黄昏鸟瞰，到黄昏内院里滑板少年的身影——Demain@1331 是一个为居民而设计的生活街区。'
      }
    }
  },
  site: {
    primaryLanguage: 'en',
    heroImages: [],
    translations: {
      en: {
        eyebrow: 'The Site',
        title1: 'A waterfront block',
        title2: 'on Kai Tak.',
        description: 'Demain@1331 occupies nine modular blocks (highlighted) on the Kai Tak Runway Park waterfront — next to the Cruise Terminal and the open promenade.'
      },
      'zh-HK': {
        eyebrow: '地點',
        title1: '啟德跨海街區',
        title2: '三十六番地。',
        description: 'Demain@1331 位於啟德跑道公園海濱，由九個模組棟舅組成（圖中綠框標示），緊鄰郵輪碼頭與開放海濱長廀。'
      },
      'zh-CN': {
        eyebrow: '地点',
        title1: '启德跨海街区',
        title2: '三十六号地。',
        description: 'Demain@1331 位于启德跑道公园海滨，由九个模块栋舍组成（图中绿框标示），紧邻邮轮码头与开放海滨长廊。'
      }
    }
  },
  transport: {
    primaryLanguage: 'en',
    heroImages: [],
    translations: {
      en: {
        eyebrow: 'Getting Here',
        title1: 'Connected to',
        title2: 'the city.',
        shuttleTitle: 'Demain Shuttle Bus',
        shuttleDescription: 'Free shuttle service between Airside / Kai Tak Station and Demain@1331. Departs every 30 minutes.',
        publicTitle: 'Public Transport',
        publicDescription: 'Ferry from Kai Tak Cruise Terminal connects to Kowloon Bay, Kwun Tong and other Kowloon districts.'
      },
      'zh-HK': {
        eyebrow: '如何到達',
        title1: '連接城市',
        title2: '的每個角落。',
        shuttleTitle: 'Demain 接駁巴士',
        shuttleDescription: '免費接駁服務，往返 Airside·啟德站與 Demain@1331，每 30 分鐘一班。',
        publicTitle: '公共交通',
        publicDescription: '從啟德郵輪碼頭出發，可連接九龍灣、觀塘及其他九龍區域。'
      },
      'zh-CN': {
        eyebrow: '如何到达',
        title1: '连接城市',
        title2: '的每个角落。',
        shuttleTitle: 'Demain 接驳巴士',
        shuttleDescription: '免费接驳服务，往返 Airside·启德站与 Demain@1331，每 30 分钟一班。',
        publicTitle: '公共交通',
        publicDescription: '从启德邮轮码头出发，可连接九龙湾、观塘及其他九龙区域。'
      }
    }
  },
  shop: {
    primaryLanguage: 'en',
    heroImages: [],
    translations: {
      en: {
        eyebrow: 'Demain Life · Objects',
        title1: 'Everyday objects,',
        title2: 'made to last.',
        intro: 'A small collection of items we use, love, and live with — from independent makers across Hong Kong and East Asia.',
        note: 'Free local delivery on orders above HK$500. Pickup available at Demain @1331.',
        addToCart: 'Add',
        all: 'All'
      },
      'zh-CN': {
        eyebrow: 'Demain Life · 物件',
        title1: '日常之物，',
        title2: '经久留存。',
        intro: '一组我们会使用、喜爱、并愿意一起生活的物件，来自香港与东亚的独立创作者。',
        note: '订单满 HK$500 可享本地配送，也可到 Demain @1331 自取。',
        addToCart: '加入',
        all: '全部'
      },
      'zh-HK': {
        eyebrow: 'Demain Life · 物件',
        title1: '日常之物，',
        title2: '經久留存。',
        intro: '一組我們會使用、喜愛、並願意一起生活的物件，來自香港與東亞的獨立創作者。',
        note: '訂單滿 HK$500 可享本地配送，也可到 Demain @1331 自取。',
        addToCart: '加入',
        all: '全部'
      }
    }
  },
  rooms: [
    {
      id: 'one-bed-studio',
      primaryLanguage: 'en',
      sortOrder: 1,
      images: [],
      translations: {
        en: {
          name: 'One-Bed Studio',
          occupancy: '1 person',
          size: '~18 m²',
          price: 'HK$ 6,800',
          period: '/ month',
          tagline: 'For postgrads, researchers and founders-in-residence.',
          description: 'A complete small apartment compressed into 18 m². Built for postgrads, visiting researchers and founders-in-residence on long-stay — anyone who needs a room that doubles as a study, a meeting space, and a private retreat.',
          highlight: 'The signature wall-fold Murphy bed clears the floor by day so the studio breathes as an office; by night the bed folds down across a fully zoned interior — foyer, bath, desk, lounge.',
          features: [
            'Wall-fold Murphy bed (single)',
            'Twin desk + side desk',
            'Window-side lounge bench',
            'Foyer wardrobe with built-in storage',
            'Private 3-piece en-suite bathroom'
          ]
        },
        'zh-CN': {
          name: '单人套房',
          occupancy: '1 人',
          size: '约 18 平方米',
          price: 'HK$ 6,800',
          period: '/ 月',
          tagline: '为研究生、访问学者与驻园创办人而设。',
          description: '18 平方米的完整小套房，为研究生、访问学者、驻园创办人长住而设 —— 一间既是书房、又是会客室、也是私密休息空间的房间。',
          highlight: '标志性翻墙单人床白天收起、地面释放成工作室；晚上放下，配合玄关、卫浴、书桌、休憩区的完整分区，立即切换成住宿模式。',
          features: [
            '翻墙收纳式单人床',
            '双张书桌 · 工作 + 访客兼用',
            '窗边休憩长椅',
            '玄关内嵌衣柜与储物',
            '独立三件式卫浴'
          ]
        },
        'zh-HK': {
          name: '單人套房',
          occupancy: '1 人',
          size: '約 18 平方米',
          price: 'HK$ 6,800',
          period: '/ 月',
          tagline: '為研究生、訪問學者與駐園創辦人而設。',
          description: '18 平方米的一個完整小套房，為研究生、訪問學者、駐園創辦人長住而設 —— 一間既是書房、又是會客室、也是私密休息空間的房間。',
          highlight: '標誌性翻牆單人床白天收起、地面解放成工作室；晚上放下，配合玄關、衛浴、書桌、休憩區的完整分區，立即切換成住宿模式。',
          features: [
            '翻牆收納式單人床',
            '雙張書桌 · 工作 + 訪客兼用',
            '窗邊休憩長椅',
            '玄關內嵌衣櫃與儲物',
            '獨立三件式衛浴'
          ]
        }
      }
    },
    {
      id: 'twin-studio',
      primaryLanguage: 'en',
      sortOrder: 2,
      images: [],
      translations: {
        en: {
          name: 'Twin Studio',
          occupancy: '2 persons',
          size: '~18 m²',
          price: 'HK$ 3,400',
          period: '/ person / month',
          tagline: 'For roommates and founder duos who share a space, not a desk.',
          description: 'A two-person suite at ~18 m² designed for student roommates, exchange-program pairs, and founder duos who need to share a space without sharing a desk.',
          highlight: 'Two wall-fold Murphy beds clear the floor by day; two desks sit back-to-back along the central axis with a pegboard divider giving each roommate their own work side. Shared lounge, shared wardrobe, one 3-piece en-suite for both.',
          features: [
            'Two wall-fold Murphy beds',
            'Back-to-back twin desks + pegboard divider',
            'Shared lounge / sofa zone',
            'Shared foyer wardrobe with storage',
            'Shared 3-piece en-suite bathroom'
          ]
        },
        'zh-CN': {
          name: '双人套房',
          occupancy: '2 人',
          size: '约 18 平方米',
          price: 'HK$ 3,400',
          period: '/ 人 / 月',
          tagline: '为室友与创办搭档而设 —— 同住，但不共桌。',
          description: '约 18 平方米双人套房，为合宿同学、交换生双人组、创办搭档而设 —— 同住但不共桌。',
          highlight: '两张翻墙床白天收起，双书桌沿中轴背靠摆放，中间以洞洞板隔屏分区，每人拥有独立工作面；沙发休憩区与玄关衣柜共用，并配一间独立三件式卫浴。',
          features: [
            '双翻墙收纳床',
            '双背靠书桌 + 中轴洞洞板隔屏',
            '共用沙发休憩区',
            '共用玄关衣柜与储物',
            '共用三件式卫浴'
          ]
        },
        'zh-HK': {
          name: '雙人套房',
          occupancy: '2 人',
          size: '約 18 平方米',
          price: 'HK$ 3,400',
          period: '/ 人 / 月',
          tagline: '為室友與創辦搭檔而設 —— 同住，但不共桌。',
          description: '約 18 平方米雙人套房，為合宿同學、交換生雙人組、創辦搭檔而設 —— 同住但不共桌。',
          highlight: '兩張翻牆床白天收起，雙書桌沿中軸背靠擺放，中間以洞洞板隔屏分區，每人擁有獨立工作面；沙發休憩區與玄關衣櫃共用，並配一間獨立三件式衛浴。',
          features: [
            '雙翻牆收納床',
            '雙背靠書桌 + 中軸洞洞板隔屏',
            '共用沙發休憩區',
            '共用玄關衣櫃與儲物',
            '共用三件式衛浴'
          ]
        }
      }
    }
  ],
  products: [
    {
      id: 'linen-tote',
      primaryLanguage: 'en',
      sortOrder: 1,
      images: [],
      translations: {
        en: { name: 'Linen Tote', category: 'Everyday', price: 'HK$ 280', description: 'Soft linen tote for daily carry.' },
        'zh-CN': { name: '亚麻托特包', category: '日常', price: 'HK$ 280', description: '适合日常携带的柔软亚麻托特包。' },
        'zh-HK': { name: '亞麻托特包', category: '日常', price: 'HK$ 280', description: '適合日常攜帶的柔軟亞麻托特包。' }
      }
    },
    {
      id: 'ceramic-mug',
      primaryLanguage: 'en',
      sortOrder: 2,
      images: [],
      translations: {
        en: { name: 'Ceramic Mug', category: 'Tableware', price: 'HK$ 180', description: 'Simple ceramic mug with warm texture.' },
        'zh-CN': { name: '陶瓷杯', category: '餐具', price: 'HK$ 180', description: '温润质感的简洁陶瓷杯。' },
        'zh-HK': { name: '陶瓷杯', category: '餐具', price: 'HK$ 180', description: '溫潤質感的簡潔陶瓷杯。' }
      }
    },
    {
      id: 'cotton-throw',
      primaryLanguage: 'en',
      sortOrder: 3,
      images: [],
      translations: {
        en: { name: 'Cotton Throw', category: 'Home', price: 'HK$ 520', description: 'Soft cotton throw for bed or lounge.' },
        'zh-CN': { name: '棉质盖毯', category: '家居', price: 'HK$ 520', description: '适合床边与休憩区使用的柔软棉毯。' },
        'zh-HK': { name: '棉質蓋毯', category: '家居', price: 'HK$ 520', description: '適合床邊與休憩區使用的柔軟棉毯。' }
      }
    },
    {
      id: 'hand-soap',
      primaryLanguage: 'en',
      sortOrder: 4,
      images: [],
      translations: {
        en: { name: 'Hand Soap', category: 'Bath', price: 'HK$ 120', description: 'Plant-based hand wash with a subtle scent.' },
        'zh-CN': { name: '洗手液', category: '沐浴', price: 'HK$ 120', description: '植物基底、香气克制的洗手液。' },
        'zh-HK': { name: '洗手液', category: '沐浴', price: 'HK$ 120', description: '植物基底、香氣克制的洗手液。' }
      }
    }
  ],
  // ============ Contract / Legal ============
  contracts: {
    version: 'v1-2026-06',
    // depositMonths default per room type; can be overridden per-booking
    depositMonthsDefault: 2,
    // Available prepayment options shown to guests
    prepayOptions: ['standard', '6_months', '12_months'],
    // Active template language → HTML body (with {{placeholders}})
    templates: {
      en: { subject: 'Tenancy Agreement', body: DEFAULT_CONTRACT_EN },
      'zh-CN': { subject: '租赁合同', body: DEFAULT_CONTRACT_ZH_CN },
      'zh-HK': { subject: '租賃合約', body: DEFAULT_CONTRACT_ZH_HK }
    }
  },
  legal: {
    terms: {
      en: { title: 'House Rules & Tenancy Terms', body: DEFAULT_TERMS_EN },
      'zh-CN': { title: '入住条款', body: DEFAULT_TERMS_ZH_CN },
      'zh-HK': { title: '入住條款', body: DEFAULT_TERMS_ZH_HK }
    },
    privacy: {
      en: { title: 'Privacy Policy (PIPO)', body: DEFAULT_PRIVACY_EN },
      'zh-CN': { title: '隐私政策（PIPO）', body: DEFAULT_PRIVACY_ZH_CN },
      'zh-HK': { title: '隱私政策（PIPO）', body: DEFAULT_PRIVACY_ZH_HK }
    }
  }
}

export function cloneDefaultSiteData() {
  return JSON.parse(JSON.stringify(defaultSiteData))
}
