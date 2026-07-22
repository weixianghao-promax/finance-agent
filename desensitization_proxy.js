class DesensitizationProxy {
    constructor() {
        this.mapping = {};
        this.reverseMapping = {};
        this.counters = {
            phone: 0,
            idcard: 0,
            bank: 0,
            amount: 0,
            company: 0,
            name: 0,
            email: 0,
            wechat: 0,
            custom: 0
        };
        this.logs = [];
        this.settings = {
            enabled: true,
            encryptionKey: 'desensitization_proxy_key',
            maxLogSize: 100,
            maskStyle: 'placeholder',
            customRules: []
        };
        this.patterns = [];
        this.loadDefaultPatterns();
    }

    loadDefaultPatterns() {
        this.patterns = [
            { category: 'phone', pattern: /1[3-9]\d{9}/g, placeholder: 'PH' },
            { category: 'idcard', pattern: /\d{17}[\dXx]/g, placeholder: 'ID' },
            { category: 'bankcard', pattern: /(62[0-9]{14,17}|4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})/g, placeholder: 'BN' },
            { category: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, placeholder: 'EM' },
            { category: 'amount', pattern: /(¥|￥)?(\d{1,3}(,\d{3})*(\.\d{2})?)\s*元/g, placeholder: 'AM' },
            { category: 'company', pattern: /([\u4e00-\u9fa5]{2,8})(集团|公司|有限公司|股份|控股|有限责任)/g, placeholder: 'CP' },
            { category: 'company2', pattern: /([\u4e00-\u9fa5]{2,6})(汽配|运输|物流|商贸|科技|电子|机械|工程|建材|化工|食品|餐饮|服务|咨询|加油站|汽修|汽配店|修理厂)/g, placeholder: 'CP' },
            { category: 'name', pattern: /\b([\u4e00-\u9fa5]{2,3})(先生|女士|经理|总)\b/g, placeholder: 'NM' },
            { category: 'name2', pattern: /([\u4e00-\u9fa5]{2,4})\s*\(/g, placeholder: 'NM' },
            { category: 'name3', pattern: /(报销人|经办人|收款人|付款人|负责人|申请人|审批人|联系人)\s*[:：]?\s*([\u4e00-\u9fa5]{2,4})/g, placeholder: 'NM' },
            { category: 'name4', pattern: /([\u4e00-\u9fa5]{2,4})\s*\)/g, placeholder: 'NM' },
            { category: 'name5', pattern: /[\u4e00-\u9fa5]{2,4}/g, placeholder: 'NM' },
            { category: 'wechat', pattern: /(微信号|微信|WeChat|wechat)\s*[:：]?\s*([a-zA-Z0-9_-]{5,})/g, placeholder: 'WC' },
            { category: 'ip', pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, placeholder: 'IP' },
            { category: 'url', pattern: /https?:\/\/[\w\-._~:/?#@!$&'()*+,;=%\\[\]]+/g, placeholder: 'URL' },
            { category: 'password', pattern: /(password|密码|passwd|pwd)[\s:=]*[a-zA-Z0-9]{6,}/gi, placeholder: 'PW' },
            { category: 'account', pattern: /(账号|用户名|user|username|login)[\s:=]*[a-zA-Z0-9_]{3,}/gi, placeholder: 'AC' }
        ];
    }

    loadConfig(config) {
        if (!config) return;
        if (config.regex_patterns) {
            config.regex_patterns.forEach(item => {
                const existing = this.patterns.find(p => p.category === item.category);
                if (existing) {
                    existing.pattern = new RegExp(item.pattern, 'g');
                } else {
                    this.patterns.push({
                        category: item.category,
                        pattern: new RegExp(item.pattern, 'g'),
                        placeholder: item.category.toUpperCase().substring(0, 2)
                    });
                }
            });
        }
        if (config.keywords) {
            Object.keys(config.keywords).forEach(category => {
                config.keywords[category].forEach(keyword => {
                    this.addCustomRule(category, keyword, category.toUpperCase().substring(0, 2));
                });
            });
        }
    }

    reset() {
        this.mapping = {};
        this.reverseMapping = {};
        this.counters = {
            phone: 0, idcard: 0, bank: 0, amount: 0,
            company: 0, name: 0, email: 0, wechat: 0, custom: 0
        };
    }

    setSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    getSettings() {
        return { ...this.settings };
    }

    escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    generateCode(category, originalValue) {
        const prefix = category.toUpperCase().substring(0, 2);
        const length = 8;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code;
        do {
            code = prefix + Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        } while (code in this.reverseMapping);
        return code;
    }

    desensitize(text) {
        if (!this.settings.enabled || !text) return text;

        this.reset();
        const originalLength = text.length;
        let result = String(text);

        const commonWords = ['公司', '金额', '日期', '摘要', '标记', '姓名', '电话', '邮箱', '地址', '发票', '报销', '审批', '付款', '收款', '转账', '现金', '银行', '账户', '凭证', '单据', '部门', '项目', '费用', '收入', '支出', '合计', '明细', '报表', '统计', '分析', '说明', '备注', '数量', '单价', '总价', '税率', '税额', '元', '万元', '亿元', '人民币', '结算', '核销', '余额', '流水', '交易', '记录', '编号', '序号', '时间', '月份', '年度', '季度', '期间', '截止', '开始', '结束', '生效', '失效', '期限', '状态', '类型', '类别', '分类', '等级', '级别', '优先级', '重要性', '紧急', '普通', '正常', '异常', '错误', '正确', '成功', '失败', '完成', '未完成', '处理中', '待处理', '已处理', '已审核', '待审核', '已批准', '待批准', '已支付', '待支付', '已收款', '待收款', '已转账', '待转账', '已核销', '待核销', '已归档', '待归档', '已删除', '已作废', '已撤销', '已退回', '已修改', '已更新', '已创建', '已提交', '已接收', '已发送', '已回复', '已确认', '已取消', '已终止', '已暂停', '已恢复', '已延期', '已提前', '已逾期', '已结清', '未结清', '已入账', '待入账', '已出账', '待出账', '已开票', '待开票', '已认证', '待认证', '已抵扣', '待抵扣', '已结转', '待结转', '已分摊', '待分摊', '已计提', '待计提', '已摊销', '待摊销', '已折旧', '待折旧', '已报废', '待报废', '已清理', '待清理', '已处置', '待处置', '已出售', '待出售', '已采购', '待采购', '已入库', '待入库', '已出库', '待出库', '已盘点', '待盘点', '已调整', '待调整', '已更正', '待更正', '已冲销', '待冲销', '已补录', '待补录', '已重算', '待重算', '已复核', '待复核', '已校验', '待校验', '已验证', '待验证', '已测试', '待测试', '已开发', '待开发', '已部署', '待部署', '已上线', '待上线', '已下线', '待下线', '已维护', '待维护', '已升级', '待升级', '已修复', '待修复', '已优化', '待优化', '已改进', '待改进', '已同步', '待同步', '已备份', '待备份', '已重置', '待重置', '已初始化', '待初始化', '已配置', '待配置', '已设置', '待设置', '已保存', '待保存', '已发布', '待发布', '已撤回', '待撤回', '现金', '支付', '金额', '摘要', '日期', '标记', '单号', '凭证', '费用', '收入', '支出', '合计', '明细', '报表', '统计', '分析', '备注', '金额', '数量', '单价', '总价', '税率', '税额', '转账', '结算', '核销', '余额', '流水', '交易', '记录', '单据', '发票', '报销', '审批', '付款', '收款', '银行', '账户', '部门', '项目', '类型', '类别', '状态', '时间', '期间', '年度', '月份', '季度', '开始', '结束', '截止', '生效', '失效', '期限', '完成', '未完成', '处理中', '待处理', '已处理', '已审核', '待审核', '已批准', '待批准', '已支付', '待支付', '已收款', '待收款', '已转账', '待转账', '已核销', '待核销', '已归档', '待归档', '已删除', '已作废', '已撤销', '已退回', '已修改', '已更新', '已创建', '已提交', '已接收', '已发送', '已回复', '已确认', '已取消', '已终止', '已暂停', '已恢复', '已延期', '已提前', '已逾期', '已结清', '未结清', '已入账', '待入账', '已出账', '待出账', '已开票', '待开票', '已认证', '待认证', '已抵扣', '待抵扣', '已结转', '待结转', '已分摊', '待分摊', '已计提', '待计提', '已摊销', '待摊销', '已折旧', '待折旧', '已报废', '待报废', '已清理', '待清理', '已处置', '待处置', '已出售', '待出售', '已采购', '待采购', '已入库', '待入库', '已出库', '待出库', '已盘点', '待盘点', '已调整', '待调整', '已更正', '待更正', '已冲销', '待冲销', '已补录', '待补录', '已重算', '待重算', '已复核', '待复核', '已校验', '待校验'];

        const sources = this.patterns.map(p => p.pattern.source);
        const combinedPattern = new RegExp(sources.join('|'), 'g');
        const processed = new Set();

        const matches = result.match(combinedPattern) || [];
        matches.forEach(matchedStr => {
            if (processed.has(matchedStr)) return;
            
            let category = 'custom';
            for (const p of this.patterns) {
                const testRegex = new RegExp(p.pattern.source);
                if (testRegex.test(matchedStr)) {
                    category = p.category;
                    break;
                }
            }
            
            if (category === 'name5' && commonWords.includes(matchedStr)) {
                return;
            }
            
            processed.add(matchedStr);
            
            const code = this.generateCode(category, matchedStr);
            this.mapping[matchedStr] = code;
            this.reverseMapping[code] = matchedStr;
            this.counters[category] = (this.counters[category] || 0) + 1;
        });

        if (this.settings.customRules && this.settings.customRules.length > 0) {
            this.settings.customRules.forEach(rule => {
                let customPattern;
                try {
                    customPattern = rule.pattern instanceof RegExp
                        ? new RegExp(rule.pattern.source, 'g')
                        : new RegExp(rule.pattern, 'g');
                } catch (e) {
                    return;
                }
                const customMatches = result.match(customPattern) || [];
                customMatches.forEach(matchedStr => {
                    if (processed.has(matchedStr)) return;
                    processed.add(matchedStr);

                    const code = this.generateCode('custom', matchedStr);
                    this.mapping[matchedStr] = code;
                    this.reverseMapping[code] = matchedStr;
                    this.counters.custom++;
                });
            });
        }

        const sortedCodes = Object.keys(this.mapping).sort((a, b) => b.length - a.length);
        const regexStr = sortedCodes.map(s => this.escapeRegExp(s)).join('|');
        if (regexStr) {
            const replaceRegex = new RegExp(regexStr, 'g');
            result = result.replace(replaceRegex, (matched) => this.mapping[matched]);
        }

        this.addLog('desensitize', '数据脱敏完成', {
            originalLength: originalLength,
            replacedCount: processed.size
        });

        return result;
    }

    restore(text) {
        if (!this.settings.enabled || !text) return text;
        
        let result = String(text);
        
        const sortedCodes = Object.keys(this.reverseMapping).sort((a, b) => b.length - a.length);
        const regexStr = sortedCodes.map(s => this.escapeRegExp(s)).join('|');
        if (regexStr) {
            const replaceRegex = new RegExp(regexStr, 'g');
            result = result.replace(replaceRegex, (matched) => this.reverseMapping[matched]);
        }

        this.addLog('restore', '数据还原完成', {
            restoredCount: Object.keys(this.reverseMapping).length
        });

        return result;
    }

    restoreWithKey(text, keyMapping) {
        if (!text || !keyMapping || typeof keyMapping !== 'object') return text;
        
        let result = String(text);
        
        const sortedCodes = Object.keys(keyMapping).sort((a, b) => b.length - a.length);
        const regexStr = sortedCodes.map(s => this.escapeRegExp(s)).join('|');
        if (regexStr) {
            const replaceRegex = new RegExp(regexStr, 'g');
            result = result.replace(replaceRegex, (matched) => keyMapping[matched] || matched);
        }

        this.addLog('restoreWithKey', '使用密钥文件还原数据完成', {
            restoredCount: Object.keys(keyMapping).length
        });

        return result;
    }

    addLog(type, message, data) {
        this.logs.unshift({
            timestamp: Date.now(),
            type: type,
            message: message,
            data: data
        });
        if (this.logs.length > this.settings.maxLogSize) {
            this.logs.pop();
        }
    }

    getLogs() {
        return [...this.logs];
    }

    clearLogs() {
        this.logs = [];
    }

    addCustomRule(name, pattern, placeholderPrefix) {
        this.settings.customRules[name] = {
            pattern: new RegExp(pattern, 'g'),
            placeholderPrefix: placeholderPrefix || 'CU'
        };
    }

    removeCustomRule(name) {
        delete this.settings.customRules[name];
    }

    getMapping() {
        return JSON.parse(JSON.stringify(this.mapping));
    }

    setMapping(mapping) {
        this.mapping = JSON.parse(JSON.stringify(mapping));
        this.reverseMapping = {};
        Object.keys(this.mapping).forEach(key => {
            this.reverseMapping[this.mapping[key]] = key;
        });
    }

    getStatistics() {
        const totalCount = Object.values(this.counters).reduce((a, b) => a + b, 0);
        return {
            totalReplaced: totalCount,
            byCategory: { ...this.counters },
            logsCount: this.logs.length,
            mappingSize: Object.keys(this.mapping).length
        };
    }

    exportLogs() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'desensitization_logs_' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    validateMapping() {
        let valid = true;
        const errors = [];
        Object.keys(this.mapping).forEach(key => {
            if (!/^\[[A-Z]{2}\d+\]$/.test(key)) {
                valid = false;
                errors.push('无效的占位符格式: ' + key);
            }
            if (!this.mapping[key] || typeof this.mapping[key] !== 'string') {
                valid = false;
                errors.push('无效的映射值: ' + key);
            }
        });
        return { valid, errors };
    }
}

const desensitizationProxy = new DesensitizationProxy();

class PrivacyDetector {
    constructor() {
        this.enabled = true;
        this.maxDetectionLength = 10000;
        this.stats = {
            totalDetections: 0,
            highRiskDetections: 0,
            mediumRiskDetections: 0,
            lastDetectionTime: null,
            lastDetectedPatterns: []
        };
        this.patterns = [];
        this.loadDefaultPatterns();
    }

    loadDefaultPatterns() {
        this.patterns = [
            { name: '机密标记', pattern: /(机密|绝密|保密|内部资料|内部文件|内部信息)/gi, severity: 'high' },
            { name: '商业秘密', pattern: /(商业秘密|商业机密|知识产权|专利|技术秘密)/gi, severity: 'high' },
            { name: '合同敏感信息', pattern: /(合同编号|合同金额|合同条款|协议金额|保密协议|竞业限制)/gi, severity: 'high' },
            { name: '客户信息', pattern: /(客户名单|客户资料|客户信息|客户联系方式|客户电话)/gi, severity: 'high' },
            { name: '财务敏感数据', pattern: /(财务报表|财务数据|审计报告|纳税申报|发票号码|银行账户|银行账号)/gi, severity: 'high' },
            { name: '报价信息', pattern: /(报价单|报价金额|投标报价|底价|成本价)/gi, severity: 'high' },
            { name: '员工信息', pattern: /(员工名单|薪资|工资|薪酬|年终奖|绩效奖金)/gi, severity: 'medium' },
            { name: '项目机密', pattern: /(项目计划|项目进度|项目预算|项目方案)/gi, severity: 'medium' },
            { name: '招投标信息', pattern: /(招标|投标|中标|标书)/gi, severity: 'medium' },
            { name: '手机号', pattern: /1[3-9]\d{9}/g, severity: 'high' },
            { name: '身份证号', pattern: /\d{17}[\dXx]/g, severity: 'high' },
            { name: '银行卡号', pattern: /(62[0-9]{14,17}|4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})/g, severity: 'high' },
            { name: '邮箱地址', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: 'medium' },
            { name: 'IP地址', pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, severity: 'medium' },
            { name: '网址链接', pattern: /https?:\/\/[\w\-._~:/?#@!$&'()*+,;=%\\[\]]+/g, severity: 'low' },
            { name: '密码', pattern: /(password|密码|passwd|pwd)[\s:=]*[a-zA-Z0-9]{6,}/gi, severity: 'high' },
            { name: '账号', pattern: /(账号|用户名|user|username|login)[\s:=]*[a-zA-Z0-9_]{3,}/gi, severity: 'medium' },
            { name: '中文姓名', pattern: /(姓[\u4e00-\u9fa5]{1,3}|名[\u4e00-\u9fa5]{1,3}|姓名[\u4e00-\u9fa5]{1,3})/g, severity: 'low' },
            { name: '详细地址', pattern: /[\u4e00-\u9fa5]+省[\u4e00-\u9fa5]+市[\u4e00-\u9fa5]+区/g, severity: 'medium' },
            { name: '内部标记', pattern: /(仅供内部|内部传阅|请勿外传|保密期限)/gi, severity: 'high' }
        ];
    }

    loadConfig(config) {
        if (!config) return;
        if (config.patterns) {
            Object.keys(config.patterns).forEach(key => {
                const item = config.patterns[key];
                this.patterns.push({
                    name: item.label,
                    pattern: item.regex,
                    severity: item.severity
                });
            });
        }
        if (config.blockedKeywords) {
            config.blockedKeywords.forEach(keyword => {
                this.patterns.push({
                    name: '敏感关键词',
                    pattern: new RegExp(keyword, 'gi'),
                    severity: 'medium'
                });
            });
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    detect(text) {
        if (!this.enabled || !text) {
            return {
                detected: false,
                matches: [],
                riskLevel: 'none',
                highRiskCount: 0,
                mediumRiskCount: 0,
                totalMatches: 0
            };
        }

        const truncatedText = text.length > this.maxDetectionLength
            ? text.substring(0, this.maxDetectionLength)
            : text;

        const detectedSensitiveInfo = [];
        const matchedPatterns = new Set();

        const allPatterns = this.patterns.filter(p => p.pattern instanceof RegExp);
        const highRiskPatterns = allPatterns.filter(p => p.severity === 'high');
        const mediumRiskPatterns = allPatterns.filter(p => p.severity === 'medium');

        let hasHighRisk = false;
        for (const pattern of highRiskPatterns) {
            if (pattern.pattern.test(truncatedText)) {
                hasHighRisk = true;
                break;
            }
        }

        if (hasHighRisk) {
            for (const pattern of highRiskPatterns) {
                const matches = truncatedText.match(pattern.pattern);
                if (matches && matches.length > 0) {
                    const uniqueMatches = [...new Set(matches)].slice(0, 5);
                    detectedSensitiveInfo.push({
                        name: pattern.name,
                        matches: uniqueMatches,
                        count: matches.length,
                        risk: pattern.severity
                    });
                    matchedPatterns.add(pattern.name);
                }
            }
        }

        if (detectedSensitiveInfo.length === 0) {
            for (const pattern of mediumRiskPatterns) {
                const matches = truncatedText.match(pattern.pattern);
                if (matches && matches.length > 0) {
                    const uniqueMatches = [...new Set(matches)].slice(0, 5);
                    detectedSensitiveInfo.push({
                        name: pattern.name,
                        matches: uniqueMatches,
                        count: matches.length,
                        risk: pattern.severity
                    });
                    matchedPatterns.add(pattern.name);
                }
            }
        }

        const highRiskCount = detectedSensitiveInfo.filter(m => m.risk === 'high').reduce((sum, m) => sum + m.count, 0);
        const mediumRiskCount = detectedSensitiveInfo.filter(m => m.risk === 'medium').reduce((sum, m) => sum + m.count, 0);

        let riskLevel = 'none';
        if (highRiskCount > 0) {
            riskLevel = 'high';
        } else if (mediumRiskCount >= 3) {
            riskLevel = 'medium';
        } else if (mediumRiskCount > 0) {
            riskLevel = 'low';
        }

        if (detectedSensitiveInfo.length > 0) {
            this.stats.totalDetections++;
            this.stats.highRiskDetections += highRiskCount;
            this.stats.mediumRiskDetections += mediumRiskCount;
            this.stats.lastDetectionTime = Date.now();
            this.stats.lastDetectedPatterns = detectedSensitiveInfo.slice(0, 5).map(m => m.name);
        }

        return {
            detected: detectedSensitiveInfo.length > 0,
            matches: detectedSensitiveInfo,
            riskLevel: riskLevel,
            highRiskCount: highRiskCount,
            mediumRiskCount: mediumRiskCount,
            totalMatches: detectedSensitiveInfo.length,
            hasHighSeverity: highRiskCount > 0,
            hasSensitiveInfo: detectedSensitiveInfo.length > 0
        };
    }

    getStats() {
        return { ...this.stats };
    }

    resetStats() {
        this.stats = {
            totalDetections: 0,
            highRiskDetections: 0,
            mediumRiskDetections: 0,
            lastDetectionTime: null,
            lastDetectedPatterns: []
        };
    }

    getPatterns() {
        return this.patterns.map(p => ({ name: p.name, risk: p.severity }));
    }

    addPattern(name, pattern, severity = 'medium') {
        this.patterns.push({
            name: name,
            pattern: typeof pattern === 'string' ? new RegExp(pattern, 'gi') : pattern,
            severity: severity
        });
    }

    removePattern(name) {
        this.patterns = this.patterns.filter(p => p.name !== name);
    }

    getDetectionReport() {
        if (this.stats.lastDetectedPatterns.length === 0) {
            return '✅ 未发现敏感信息';
        }
        let report = '❌ 检测到敏感信息：\n\n';
        this.stats.lastDetectedPatterns.forEach(name => {
            const pattern = this.patterns.find(p => p.name === name);
            if (pattern) {
                const severityIcon = pattern.severity === 'high' ? '🔴' : (pattern.severity === 'medium' ? '🟡' : '🟢');
                report += severityIcon + ' ' + name + '\n';
            }
        });
        return report;
    }
}

const privacyDetector = new PrivacyDetector();

if (typeof window !== 'undefined') {
    window.desensitizationProxy = desensitizationProxy;
    window.privacyDetector = privacyDetector;
    window.DesensitizationProxy = DesensitizationProxy;
    window.PrivacyDetector = PrivacyDetector;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DesensitizationProxy, desensitizationProxy, PrivacyDetector, privacyDetector };
}