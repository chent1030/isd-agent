/**
 * 查询员工信息
 * @param {object} params
 * @param {string} params.keyword - 员工姓名或工号
 */
exports.execute = async function (params) {
  const { keyword } = params

  // TODO: 替换为真实内部 API
  // const res = await fetch(`http://internal-api/employee?q=${encodeURIComponent(keyword)}`)
  // return JSON.stringify(await res.json())

  return JSON.stringify({
    empName: '示例员工',
    empWorkNo: keyword,
    dept: '研发部',
    email: 'example@company.com',
  })
}
