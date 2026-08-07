import { Link } from 'react-router-dom'
import { Button, EmptyState } from '../components/ui/index.js'

function NotFoundPage() {
  return (
    <EmptyState
      symbol="404"
      eyebrow="页面不存在"
      title="没有找到这个页面"
      description="地址可能输入错误，或者这个功能还没有加入当前 Web 工具。"
      actions={<Button as={Link} to="/home">返回系统总览</Button>}
    />
  )
}

export default NotFoundPage
