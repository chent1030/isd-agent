/**
 * 查询员工信息 skill
 * params 由 LLM 根据 manifest.json 中的 parameters 自动填充
 */
exports.execute = async function (params) {
  const { keyword } = params

  // TODO: 替换为真实的内部 API 调用
  // const res = await fetch(`http://internal-api/employee?q=${keyword}`)
  // return JSON.stringify(await res.json())

  // 示例返回
  return JSON.stringify({
    empName: '示例员工',
    empWorkNo: keyword,
    dept: '研发部',
    email: 'example@company.com',
  })
}
