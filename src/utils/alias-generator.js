/**
 * 邮箱别名生成器
 * 通过姓氏和名字的拼音组合生成唯一别名
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中国常见姓氏拼音数组（100个）
const SURNAMES = [
	'wang',
	'li',
	'zhang',
	'liu',
	'chen',
	'yang',
	'huang',
	'zhao',
	'wu',
	'zhou',
	'xu',
	'sun',
	'ma',
	'zhu',
	'hu',
	'guo',
	'he',
	'gao',
	'lin',
	'luo',
	'zheng',
	'liang',
	'xie',
	'song',
	'tang',
	'han',
	'feng',
	'yu',
	'dong',
	'xiao',
	'cheng',
	'cao',
	'yuan',
	'deng',
	'xu',
	'fu',
	'shen',
	'zeng',
	'peng',
	'lu',
	'su',
	'jiang',
	'cai',
	'jia',
	'ding',
	'wei',
	'xue',
	'ye',
	'yan',
	'pan',
	'du',
	'dai',
	'xia',
	'zhong',
	'wang',
	'tian',
	'ren',
	'jiang',
	'fan',
	'fang',
	'shi',
	'yao',
	'tan',
	'sheng',
	'zou',
	'xiong',
	'jin',
	'lu',
	'hao',
	'kong',
	'bai',
	'cui',
	'kang',
	'mao',
	'qiu',
	'qin',
	'jiang',
	'shi',
	'gu',
	'hou',
	'shao',
	'meng',
	'long',
	'wan',
	'duan',
	'zhang',
	'qian',
	'tang',
	'yin',
	'li',
	'yi',
	'chang',
	'wu',
	'qiao',
	'he',
	'lai',
	'gong',
	'wen',
	'pang',
	'lan',
];

// 常见名字拼音数组（100个）
const GIVEN_NAMES = [
	'wei',
	'fang',
	'na',
	'min',
	'jing',
	'lei',
	'jun',
	'tao',
	'yan',
	'bin',
	'li',
	'qiang',
	'jie',
	'ping',
	'hua',
	'yong',
	'dan',
	'hong',
	'feng',
	'ying',
	'hui',
	'jian',
	'lan',
	'yun',
	'xin',
	'rui',
	'bo',
	'yang',
	'ming',
	'xuan',
	'hao',
	'yu',
	'han',
	'chen',
	'xi',
	'kai',
	'lin',
	'ran',
	'xiang',
	'zhe',
	'yuan',
	'rong',
	'chao',
	'kun',
	'peng',
	'gang',
	'long',
	'wen',
	'huan',
	'jia',
	'yu',
	'ning',
	'zhen',
	'sheng',
	'qing',
	'hai',
	'ting',
	'xiu',
	'jie',
	'mei',
	'li',
	'qin',
	'yuan',
	'shu',
	'juan',
	'ying',
	'yue',
	'qian',
	'zhen',
	'xiao',
	'meng',
	'shan',
	'xin',
	'jing',
	'yao',
	'ling',
	'yan',
	'qi',
	'rui',
	'xuan',
	'han',
	'fei',
	'ming',
	'yu',
	'chen',
	'hao',
	'bin',
	'xiang',
	'yun',
	'wen',
	'jing',
	'hui',
	'feng',
	'lan',
	'xia',
	'hong',
	'lei',
	'tao',
];

class AliasGenerator {
	constructor() {
		this.indexFile = path.join(__dirname, '..', 'data', 'alias-index.json');
	}

	/**
	 * 获取当前索引
	 */
	async getIndex() {
		try {
			const content = await fs.readFile(this.indexFile, 'utf-8');
			return JSON.parse(content);
		} catch (error) {
			// 如果文件不存在，返回初始索引
			return { surnameIndex: 0, givenNameIndex: 0 };
		}
	}

	/**
	 * 保存索引
	 */
	async saveIndex(index) {
		try {
			// 确保目录存在
			const dir = path.dirname(this.indexFile);
			await fs.mkdir(dir, { recursive: true });

			// 保存索引
			await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2), 'utf-8');
		} catch (error) {
			console.error('[错误] 保存索引失败:', error.message);
			throw error;
		}
	}

	/**
	 * 生成下一个别名
	 * @returns {Promise<{alias: string, index: object}>}
	 */
	async generateNext() {
		try {
			// 获取当前索引
			const index = await this.getIndex();
			let { surnameIndex, givenNameIndex } = index;

			// 生成别名（姓氏拼音 + 名字拼音）
			const surname = SURNAMES[surnameIndex];
			const givenName = GIVEN_NAMES[givenNameIndex];

			// 生成2个随机字母（a-z）
			const randomLetters = this.generateRandomLetters(2);

			// 组合别名：姓氏 + 名字 + 随机字母
			const alias = surname + givenName + randomLetters;

			// 更新索引
			givenNameIndex++;
			if (givenNameIndex >= GIVEN_NAMES.length) {
				givenNameIndex = 0;
				surnameIndex++;
				if (surnameIndex >= SURNAMES.length) {
					// 所有组合已用完，重置
					console.warn('[警告] 所有别名组合已用完，重置索引');
					surnameIndex = 0;
				}
			}

			const newIndex = { surnameIndex, givenNameIndex };

			// 保存新索引
			await this.saveIndex(newIndex);

			return {
				alias,
				index: newIndex,
			};
		} catch (error) {
			console.error('[错误] 生成别名失败:', error.message);
			throw error;
		}
	}

	/**
	 * 生成指定长度的随机字母（a-z）
	 * @param {number} length - 字母长度
	 * @returns {string}
	 */
	generateRandomLetters(length) {
		const letters = 'abcdefghijklmnopqrstuvwxyz';
		let result = '';
		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * letters.length);
			result += letters[randomIndex];
		}
		return result;
	}

	/**
	 * 重置索引
	 */
	async resetIndex() {
		const index = { surnameIndex: 0, givenNameIndex: 0 };
		await this.saveIndex(index);
		console.log('[索引] 已重置索引');
	}

	/**
	 * 获取当前别名（不递增索引）
	 */
	async getCurrentAlias() {
		const index = await this.getIndex();
		const { surnameIndex, givenNameIndex } = index;
		const surname = SURNAMES[surnameIndex];
		const givenName = GIVEN_NAMES[givenNameIndex];
		return surname + givenName;
	}

	/**
	 * 获取剩余可用别名数量
	 */
	async getRemainingCount() {
		const index = await this.getIndex();
		const { surnameIndex, givenNameIndex } = index;
		const total = SURNAMES.length * GIVEN_NAMES.length;
		const used = surnameIndex * GIVEN_NAMES.length + givenNameIndex;
		return total - used;
	}
}

export default AliasGenerator;

// 测试代码
if (import.meta.url === `file://${process.argv[1]}`) {
	(async () => {
		const generator = new AliasGenerator();

		console.log('=== 别名生成器测试 ===\n');

		// 获取当前别名
		const current = await generator.getCurrentAlias();
		console.log(`当前别名: ${current}`);

		// 获取剩余数量
		const remaining = await generator.getRemainingCount();
		console.log(`剩余可用: ${remaining} 个\n`);

		// 生成5个别名测试
		console.log('生成5个别名:');
		for (let i = 0; i < 5; i++) {
			const result = await generator.generateNext();
			console.log(
				`  ${i + 1}. ${result.alias} (索引: ${result.index.surnameIndex}, ${result.index.givenNameIndex})`
			);
		}
	})();
}
