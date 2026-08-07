export function createRoleFeedback(winner, roleConfigs) {
  const messageKey = ['A', 'B', 'tie'].includes(winner) ? winner : 'undetermined'
  return roleConfigs.map((role) => ({
    id: role.id,
    name: role.name,
    focus: role.focus,
    message: role.messages[messageKey],
  }))
}
