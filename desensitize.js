function desensitizeFileData(rawContent, options) {
    if (!rawContent || typeof rawContent !== 'string') {
        return rawContent || '';
    }

    const config = {
        maskPhone: true,
        maskIdCard: true,
        maskCompanyName: true,
        maskContractNo: true,
        maskFinanceAmount: false,
        maskBankCard: true,
        maskEmail: true,
        maskName: true,
        maskWechat: true,
        maskPassword: true,
        maskAccount: true,
        ...options
    };

    let result = rawContent;

    if (config.maskPhone) {
        result = result.replace(/1[3-9]\d{9}/g, function(match) {
            return match.substring(0, 3) + '****' + match.substring(7);
        });
    }

    if (config.maskIdCard) {
        result = result.replace(/\d{17}[\dXx]/g, function(match) {
            return match.substring(0, 6) + '***********' + match.substring(17);
        });
    }

    if (config.maskBankCard) {
        result = result.replace(/(62[0-9]{14,17}|4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})/g, function(match) {
            if (match.length >= 16) {
                return match.substring(0, 4) + '********' + match.substring(12);
            }
            return match.substring(0, 4) + '****' + match.substring(8);
        });
    }

    if (config.maskEmail) {
        result = result.replace(/([a-zA-Z0-9._%+-]{1,3})[a-zA-Z0-9._%+-]*@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1****@$2');
    }

    if (config.maskCompanyName) {
        result = result.replace(/([\u4e00-\u9fa5]{2,8})(集团|公司|有限公司|股份|控股|有限责任)/g, function(match, name, suffix) {
            if (name.length <= 2) {
                return name.charAt(0) + '*' + suffix;
            }
            return name.charAt(0) + '**' + suffix;
        });
        
        result = result.replace(/([\u4e00-\u9fa5]{2,6})(汽配|运输|物流|商贸|科技|电子|机械|工程|建材|化工|食品|餐饮|服务|咨询)/g, function(match, name, suffix) {
            if (name.length === 2) {
                return name.charAt(0) + '*' + suffix;
            }
            return name.charAt(0) + '**' + suffix;
        });
        
        result = result.replace(/([\u4e00-\u9fa5]{2,6})(加油站|汽修|汽配店|修理厂)/g, function(match, name, suffix) {
            if (name.length === 2) {
                return name.charAt(0) + '*' + suffix;
            }
            return name.charAt(0) + '**' + suffix;
        });
    }

    if (config.maskContractNo) {
        result = result.replace(/(合同编号|合同号|协议编号|协议号)\s*[:：]?\s*([A-Za-z0-9\-]{8,})/g, '$1：****');
        result = result.replace(/([A-Za-z]{2,4}[\-]?\d{8,20})/g, function(match) {
            return match.substring(0, 4) + '********';
        });
    }

    if (config.maskFinanceAmount) {
        result = result.replace(/(¥|￥)?(\d{1,3}(,\d{3})*(\.\d{2})?)\s*元/g, '****元');
        result = result.replace(/(\d{1,3}(,\d{3})*(\.\d{2})?)\s*(万元|亿元)/g, '****$2');
    }

    if (config.maskName) {
        result = result.replace(/\b([\u4e00-\u9fa5]{2,3})(先生|女士|经理|总|主任)\b/g, function(match, name, title) {
            if (name.length === 2) {
                return name.charAt(0) + '*' + title;
            }
            return name.charAt(0) + '*' + name.charAt(name.length - 1) + title;
        });
        
        result = result.replace(/([\u4e00-\u9fa5]{2,4})\s*\(\s*[\u4e00-\u9fa5]*\s*\)/g, function(match) {
            const nameMatch = match.match(/([\u4e00-\u9fa5]{2,4})/);
            if (nameMatch) {
                const name = nameMatch[1];
                if (name.length === 2) {
                    return name.charAt(0) + '*' + match.substring(2);
                } else if (name.length === 3) {
                    return name.charAt(0) + '*' + name.charAt(2) + match.substring(3);
                } else {
                    return name.charAt(0) + '**' + name.charAt(name.length - 1) + match.substring(name.length);
                }
            }
            return match;
        });
        
        result = result.replace(/(报销人|经办人|收款人|付款人|负责人|申请人|审批人|联系人)\s*[:：]?\s*([\u4e00-\u9fa5]{2,4})/g, function(match, prefix, name) {
            if (name.length === 2) {
                return prefix + '：' + name.charAt(0) + '*';
            } else if (name.length === 3) {
                return prefix + '：' + name.charAt(0) + '*' + name.charAt(2);
            } else {
                return prefix + '：' + name.charAt(0) + '**' + name.charAt(name.length - 1);
            }
        });
        
        result = result.replace(/([\u4e00-\u9fa5]{2,4})\s*\)/g, function(match) {
            const nameMatch = match.match(/([\u4e00-\u9fa5]{2,4})/);
            if (nameMatch) {
                const name = nameMatch[1];
                if (name.length === 2) {
                    return name.charAt(0) + '*' + ')';
                } else if (name.length === 3) {
                    return name.charAt(0) + '*' + name.charAt(2) + ')';
                } else {
                    return name.charAt(0) + '**' + name.charAt(name.length - 1) + ')';
                }
            }
            return match;
        });
        
        result = result.replace(/[\u4e00-\u9fa5]{2,4}/g, function(match) {
            const commonWords = ['公司', '金额', '日期', '摘要', '标记', '姓名', '电话', '邮箱', '地址', '发票', '报销', '审批', '付款', '收款', '转账', '现金', '银行', '账户', '凭证', '单据', '部门', '项目', '费用', '收入', '支出', '合计', '明细', '报表', '统计', '分析', '说明', '备注', '数量', '单价', '总价', '税率', '税额', '金额', '元', '万元', '亿元', '人民币', '转账', '支付', '结算', '核销', '余额', '流水', '交易', '记录', '凭证号', '单据号', '发票号', '合同号', '协议号', '订单号', '批次号', '编号', '序号', '日期', '时间', '月份', '年度', '季度', '期间', '截止', '开始', '结束', '生效', '失效', '期限', '有效期', '状态', '类型', '类别', '分类', '等级', '级别', '优先级', '重要性', '紧急', '普通', '正常', '异常', '错误', '正确', '成功', '失败', '完成', '未完成', '处理中', '待处理', '已处理', '已审核', '待审核', '已批准', '待批准', '已支付', '待支付', '已收款', '待收款', '已转账', '待转账', '已核销', '待核销', '已归档', '待归档', '已删除', '已作废', '已撤销', '已退回', '已修改', '已更新', '已创建', '已提交', '已接收', '已发送', '已回复', '已确认', '已取消', '已终止', '已暂停', '已恢复', '已延期', '已提前', '已逾期', '已结清', '未结清', '已入账', '待入账', '已出账', '待出账', '已开票', '待开票', '已认证', '待认证', '已抵扣', '待抵扣', '已结转', '待结转', '已分摊', '待分摊', '已计提', '待计提', '已摊销', '待摊销', '已折旧', '待折旧', '已报废', '待报废', '已清理', '待清理', '已处置', '待处置', '已出售', '待出售', '已采购', '待采购', '已入库', '待入库', '已出库', '待出库', '已盘点', '待盘点', '已调整', '待调整', '已更正', '待更正', '已冲销', '待冲销', '已补录', '待补录', '已重算', '待重算', '已复核', '待复核', '已校验', '待校验', '已确认', '待确认', '已验证', '待验证', '已测试', '待测试', '已开发', '待开发', '已部署', '待部署', '已上线', '待上线', '已下线', '待下线', '已维护', '待维护', '已升级', '待升级', '已修复', '待修复', '已优化', '待优化', '已改进', '待改进', '已更新', '待更新', '已同步', '待同步', '已备份', '待备份', '已恢复', '待恢复', '已迁移', '待迁移', '已整合', '待整合', '已拆分', '待拆分', '已合并', '待合并', '已重组', '待重组', '已注销', '待注销', '已注册', '待注册', '已备案', '待备案', '已审批', '待审批', '已核准', '待核准', '已备案', '待备案', '已登记', '待登记', '已注册', '待注册', '已认证', '待认证', '已许可', '待许可', '已授权', '待授权', '已验收', '待验收', '已交付', '待交付', '已投产', '待投产', '已运营', '待运营', '已关闭', '待关闭', '已停用', '待停用', '已启用', '待启用', '已激活', '待激活', '已冻结', '待冻结', '已解冻', '待解冻', '已锁定', '待锁定', '已解锁', '待解锁', '已归档', '待归档', '已删除', '待删除', '已恢复', '待恢复', '已清空', '待清空', '已重置', '待重置', '已初始化', '待初始化', '已配置', '待配置', '已设置', '待设置', '已修改', '待修改', '已更新', '待更新', '已保存', '待保存', '已提交', '待提交', '已发布', '待发布', '已撤回', '待撤回', '已删除', '待删除', '已恢复', '待恢复', '已清空', '待清空', '已重置', '待重置', '已初始化', '待初始化'];
            
            if (commonWords.includes(match)) {
                return match;
            }
            
            if (match.length === 2) {
                return match.charAt(0) + '*';
            } else if (match.length === 3) {
                return match.charAt(0) + '*' + match.charAt(2);
            } else {
                return match.charAt(0) + '**' + match.charAt(match.length - 1);
            }
        });
    }

    if (config.maskWechat) {
        result = result.replace(/(微信号|微信|WeChat|wechat)\s*[:：]?\s*([a-zA-Z0-9_-]{5,})/g, '$1：****');
    }

    if (config.maskPassword) {
        result = result.replace(/(password|密码|passwd|pwd)[\s:=]*[a-zA-Z0-9]{6,}/gi, '$1：****');
    }

    if (config.maskAccount) {
        result = result.replace(/(账号|用户名|user|username|login)[\s:=]*[a-zA-Z0-9_]{3,}/gi, '$1：****');
    }

    return result;
}

function detectSensitiveInfo(content) {
    if (!content || typeof content !== 'string') {
        return { detected: false, matches: [], riskLevel: 'none' };
    }

    const patterns = [
        { name: '手机号', pattern: /1[3-9]\d{9}/g, severity: 'high' },
        { name: '身份证号', pattern: /\d{17}[\dXx]/g, severity: 'high' },
        { name: '银行卡号', pattern: /(62[0-9]{14,17}|4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})/g, severity: 'high' },
        { name: '邮箱地址', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, severity: 'medium' },
        { name: '公司名称', pattern: /([\u4e00-\u9fa5]{2,8})(集团|公司|有限公司|股份|控股|有限责任)/g, severity: 'medium' },
        { name: '合同编号', pattern: /(合同编号|合同号|协议编号|协议号)\s*[:：]?\s*([A-Za-z0-9\-]{8,})/g, severity: 'high' },
        { name: '密码', pattern: /(password|密码|passwd|pwd)[\s:=]*[a-zA-Z0-9]{6,}/gi, severity: 'high' },
        { name: '账号', pattern: /(账号|用户名|user|username|login)[\s:=]*[a-zA-Z0-9_]{3,}/gi, severity: 'medium' },
        { name: '微信号', pattern: /(微信号|微信|WeChat|wechat)\s*[:：]?\s*([a-zA-Z0-9_-]{5,})/g, severity: 'medium' },
        { name: '机密标记', pattern: /(机密|绝密|保密|内部资料|内部文件|内部信息)/gi, severity: 'high' },
        { name: '商业秘密', pattern: /(商业秘密|商业机密|知识产权|专利|技术秘密)/gi, severity: 'high' },
        { name: '财务数据', pattern: /(财务报表|财务数据|审计报告|纳税申报|发票号码|银行账户)/gi, severity: 'high' },
        { name: '客户信息', pattern: /(客户名单|客户资料|客户信息|客户联系方式)/gi, severity: 'high' },
        { name: '员工信息', pattern: /(员工名单|薪资|工资|薪酬|年终奖)/gi, severity: 'medium' },
        { name: '项目机密', pattern: /(项目计划|项目进度|项目预算|项目方案)/gi, severity: 'medium' },
        { name: '招投标信息', pattern: /(招标|投标|中标|标书|报价单)/gi, severity: 'medium' },
        { name: 'IP地址', pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, severity: 'medium' },
        { name: '网址链接', pattern: /https?:\/\/[\w\-._~:/?#@!$&'()*+,;=%\\[\]]+/g, severity: 'low' },
        { name: '详细地址', pattern: /[\u4e00-\u9fa5]+省[\u4e00-\u9fa5]+市[\u4e00-\u9fa5]+区/g, severity: 'medium' },
        { name: '中文姓名', pattern: /(姓[\u4e00-\u9fa5]{1,3}|名[\u4e00-\u9fa5]{1,3}|姓名[\u4e00-\u9fa5]{1,3})/g, severity: 'low' }
    ];

    const detected = [];
    let highRiskCount = 0;
    let mediumRiskCount = 0;

    patterns.forEach(pattern => {
        const matches = content.match(pattern.pattern);
        if (matches && matches.length > 0) {
            const uniqueMatches = [...new Set(matches)].slice(0, 5);
            detected.push({
                name: pattern.name,
                matches: uniqueMatches,
                count: matches.length,
                severity: pattern.severity
            });
            if (pattern.severity === 'high') {
                highRiskCount += matches.length;
            } else if (pattern.severity === 'medium') {
                mediumRiskCount += matches.length;
            }
        }
    });

    let riskLevel = 'none';
    if (highRiskCount > 0) {
        riskLevel = 'high';
    } else if (mediumRiskCount >= 3) {
        riskLevel = 'medium';
    } else if (mediumRiskCount > 0) {
        riskLevel = 'low';
    }

    return {
        detected: detected.length > 0,
        matches: detected,
        riskLevel: riskLevel,
        highRiskCount: highRiskCount,
        mediumRiskCount: mediumRiskCount,
        totalMatches: detected.length,
        hasHighSeverity: highRiskCount > 0
    };
}

if (typeof window !== 'undefined') {
    window.desensitizeFileData = desensitizeFileData;
    window.detectSensitiveInfo = detectSensitiveInfo;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        desensitizeFileData,
        detectSensitiveInfo
    };
}