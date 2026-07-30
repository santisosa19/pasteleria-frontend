import { FormEvent, useEffect, useState } from 'react'
import { listPermissions, type Permission } from '../../features/permissions/api/permissionsApi'
import { createRole, deleteRole, listRoles, updateRole, updateRolePermissions, type Role } from '../../features/roles/api/rolesApi'
import { createUser, disableUser, listUsers, updateUser, type UserSummary } from '../../features/users/api/usersApi'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { ConfirmDialog } from '../../shared/components/ConfirmDialog'
import { Modal } from '../../shared/components/Modal'
import { Toast, type ToastState } from '../../shared/components/Toast'
import { getErrorMessage } from '../../shared/utils/errors'
import { emptyToUndefined } from '../../shared/utils/formatters'

type UserForm = {
  email: string
  firstName: string
  isActive: boolean
  lastName: string
  password: string
  roleId: string
  username: string
}

type RoleForm = {
  name: string
}

const initialUserForm: UserForm = { email: '', firstName: '', isActive: true, lastName: '', password: '', roleId: '', username: '' }
const initialRoleForm: RoleForm = { name: '' }

export function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [userForm, setUserForm] = useState<UserForm>(initialUserForm)
  const [roleForm, setRoleForm] = useState<RoleForm>(initialRoleForm)
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [userToDisable, setUserToDisable] = useState<UserSummary | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [isSavingPermissions, setIsSavingPermissions] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [userError, setUserError] = useState('')
  const [roleError, setRoleError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [search, setSearch] = useState('')

  const permissionsSet = new Set(user?.permissions ?? [])
  const canCreateUser = permissionsSet.has('users:create')
  const canReadUsers = permissionsSet.has('users:read')
  const canUpdateUser = permissionsSet.has('users:update')
  const canDisableUser = permissionsSet.has('users:disable')
  const canCreateRole = permissionsSet.has('roles:create')
  const canReadRoles = permissionsSet.has('roles:read')
  const canUpdateRole = permissionsSet.has('roles:update')
  const canDeleteRole = permissionsSet.has('roles:delete')
  const canUpdateRolePermissions = permissionsSet.has('roles:permissions:update')
  const canReadPermissions = permissionsSet.has('permissions:read')
  const selectedRole = roles.find((role) => role.id === selectedRoleId)
  const filteredUsers = users.filter((systemUser) => {
    const normalizedSearch = search.trim().toLowerCase()

    return !normalizedSearch || [systemUser.username, systemUser.email, systemUser.firstName, systemUser.lastName, systemUser.role.name]
      .some((value) => value.toLowerCase().includes(normalizedSearch))
  })
  const groupedPermissions = groupPermissions(permissions)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const [usersData, rolesData, permissionsData] = await Promise.all([
          canReadUsers ? listUsers() : Promise.resolve([]),
          canReadRoles ? listRoles() : Promise.resolve([]),
          canReadPermissions ? listPermissions() : Promise.resolve([]),
        ])

        if (isMounted) {
          setUsers(usersData)
          setRoles(rolesData)
          setPermissions(permissionsData)
          const firstRole = rolesData[0]
          if (firstRole) {
            setSelectedRoleId(firstRole.id)
            setSelectedPermissionIds(firstRole.permissions.map((rolePermission) => rolePermission.permissionId))
          }
        }
      } catch (caughtError) {
        if (isMounted) setToast({ message: getErrorMessage(caughtError), tone: 'error' })
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()
    return () => { isMounted = false }
  }, [canReadPermissions, canReadRoles, canReadUsers])

  function selectRole(roleId: string) {
    const role = roles.find((currentRole) => currentRole.id === roleId)
    setSelectedRoleId(roleId)
    setSelectedPermissionIds(role?.permissions.map((rolePermission) => rolePermission.permissionId) ?? [])
  }

  async function refreshUsers() {
    if (canReadUsers) setUsers(await listUsers())
  }

  async function refreshRoles(nextSelectedRoleId = selectedRoleId) {
    if (!canReadRoles) return
    const rolesData = await listRoles()
    setRoles(rolesData)
    const role = rolesData.find((currentRole) => currentRole.id === nextSelectedRoleId) ?? rolesData[0]
    setSelectedRoleId(role?.id ?? '')
    setSelectedPermissionIds(role?.permissions.map((rolePermission) => rolePermission.permissionId) ?? [])
  }

  function openCreateUserModal() {
    setEditingUser(null)
    setUserForm({ ...initialUserForm, roleId: roles[0]?.id ?? '' })
    setUserError('')
    setIsUserModalOpen(true)
  }

  function openEditUserModal(systemUser: UserSummary) {
    setEditingUser(systemUser)
    setUserForm({
      email: systemUser.email,
      firstName: systemUser.firstName,
      isActive: systemUser.isActive,
      lastName: systemUser.lastName,
      password: '',
      roleId: systemUser.role.id,
      username: systemUser.username,
    })
    setUserError('')
    setIsUserModalOpen(true)
  }

  function closeUserModal() {
    if (isSavingUser) return
    setIsUserModalOpen(false)
    setEditingUser(null)
    setUserForm(initialUserForm)
    setUserError('')
  }

  async function handleUserSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingUser(true)
    setUserError('')

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          email: userForm.email,
          firstName: userForm.firstName,
          isActive: userForm.isActive,
          lastName: userForm.lastName,
          password: emptyToUndefined(userForm.password),
          roleId: userForm.roleId,
          username: userForm.username,
        })
      } else {
        await createUser({
          email: userForm.email,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          password: userForm.password,
          roleId: userForm.roleId,
          username: userForm.username,
        })
      }

      await refreshUsers()
      setToast({ message: editingUser ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.', tone: 'success' })
      closeUserModal()
    } catch (caughtError) {
      setUserError(getErrorMessage(caughtError))
    } finally {
      setIsSavingUser(false)
    }
  }

  async function handleDisableUser() {
    if (!userToDisable) return
    setIsConfirming(true)

    try {
      await disableUser(userToDisable.id)
      await refreshUsers()
      setToast({ message: 'Usuario desactivado correctamente.', tone: 'success' })
      setUserToDisable(null)
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
    } finally {
      setIsConfirming(false)
    }
  }

  function openCreateRoleModal() {
    setEditingRole(null)
    setRoleForm(initialRoleForm)
    setRoleError('')
    setIsRoleModalOpen(true)
  }

  function openEditRoleModal(role: Role) {
    setEditingRole(role)
    setRoleForm({ name: role.name })
    setRoleError('')
    setIsRoleModalOpen(true)
  }

  function closeRoleModal() {
    if (isSavingRole) return
    setIsRoleModalOpen(false)
    setEditingRole(null)
    setRoleForm(initialRoleForm)
    setRoleError('')
  }

  async function handleRoleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingRole(true)
    setRoleError('')

    try {
      const role = editingRole
        ? await updateRole(editingRole.id, { name: roleForm.name })
        : await createRole({ name: roleForm.name, permissionIds: [] })

      await refreshRoles(role.id)
      setToast({ message: editingRole ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.', tone: 'success' })
      closeRoleModal()
    } catch (caughtError) {
      setRoleError(getErrorMessage(caughtError))
    } finally {
      setIsSavingRole(false)
    }
  }

  async function handleDeleteRole() {
    if (!roleToDelete) return
    setIsConfirming(true)

    try {
      await deleteRole(roleToDelete.id)
      await refreshRoles()
      setToast({ message: 'Rol eliminado correctamente.', tone: 'success' })
      setRoleToDelete(null)
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
    } finally {
      setIsConfirming(false)
    }
  }

  async function handlePermissionsSubmit() {
    if (!selectedRoleId) return
    setIsSavingPermissions(true)

    try {
      await updateRolePermissions(selectedRoleId, selectedPermissionIds)
      await refreshRoles(selectedRoleId)
      setToast({ message: 'Permisos del rol actualizados correctamente.', tone: 'success' })
    } catch (caughtError) {
      setToast({ message: getErrorMessage(caughtError), tone: 'error' })
    } finally {
      setIsSavingPermissions(false)
    }
  }

  function togglePermission(permissionId: string) {
    setSelectedPermissionIds((currentIds) => (
      currentIds.includes(permissionId)
        ? currentIds.filter((currentId) => currentId !== permissionId)
        : [...currentIds, permissionId]
    ))
  }

  return (
    <section className="resource-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="page-heading resource-heading">
        <div>
          <span className="eyebrow">Seguridad</span>
          <h1>Usuarios y permisos</h1>
          <p>Administra cuentas internas, roles y matriz granular de permisos por accion.</p>
        </div>
        {canCreateUser ? <button className="primary-button resource-create-button" type="button" onClick={openCreateUserModal}>Nuevo usuario</button> : null}
      </div>

      {canReadUsers ? (
        <div className="page-card table-card">
          <div className="table-header"><h2>Usuarios</h2><span>{filteredUsers.length} de {users.length} cuentas</span></div>
          <div className="resource-toolbar security-toolbar">
            <label><span>Buscar</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Usuario, email, nombre o rol" /></label>
            <button className="ghost-button" type="button" onClick={() => setSearch('')}>Limpiar</button>
          </div>
          {isLoading ? <p>Cargando usuarios...</p> : <div className="table-wrap"><table><thead><tr><th>Usuario</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{filteredUsers.map((systemUser) => <tr key={systemUser.id}><td>{systemUser.username}</td><td>{systemUser.firstName} {systemUser.lastName}</td><td>{systemUser.email}</td><td>{systemUser.role.name}</td><td>{systemUser.isActive ? 'Activo' : 'Inactivo'}</td><td className="row-actions">{canUpdateUser ? <button type="button" onClick={() => openEditUserModal(systemUser)}>Editar</button> : null}{canDisableUser && systemUser.isActive ? <button type="button" onClick={() => setUserToDisable(systemUser)}>Desactivar</button> : null}</td></tr>)}</tbody></table>{!filteredUsers.length ? <p className="helper-text">No hay usuarios para mostrar.</p> : null}</div>}
        </div>
      ) : null}

      {canReadRoles ? (
        <div className="page-card security-roles-card">
          <div className="table-header"><h2>Roles</h2>{canCreateRole ? <button className="ghost-button" type="button" onClick={openCreateRoleModal}>Nuevo rol</button> : null}</div>
          <div className="role-list">
            {roles.map((role) => (
              <article className={`role-card${role.id === selectedRoleId ? ' role-card-selected' : ''}`} key={role.id}>
                <button type="button" onClick={() => selectRole(role.id)}>
                  <strong>{role.name}</strong>
                  <span>{role.permissions.length} permisos · {role._count?.users ?? 0} usuarios</span>
                </button>
                <div className="row-actions">
                  {canUpdateRole ? <button type="button" onClick={() => openEditRoleModal(role)}>Editar</button> : null}
                  {canDeleteRole ? <button type="button" onClick={() => setRoleToDelete(role)}>Eliminar</button> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {canReadRoles && canReadPermissions ? (
        <div className="page-card table-card">
          <div className="table-header">
            <div><h2>Matriz de permisos</h2><span>{selectedRole ? `Rol seleccionado: ${selectedRole.name}` : 'Selecciona un rol'}</span></div>
            {canUpdateRolePermissions ? <button className="primary-button resource-create-button" disabled={!selectedRoleId || isSavingPermissions} type="button" onClick={() => void handlePermissionsSubmit()}>{isSavingPermissions ? 'Guardando...' : 'Guardar matriz'}</button> : null}
          </div>
          <div className="permission-matrix">
            {groupedPermissions.map((group) => (
              <section className="permission-group" key={group.module}>
                <h3>{moduleLabel(group.module)}</h3>
                <div className="permission-list">
                  {group.permissions.map((permission) => (
                    <label className="permission-check" key={permission.id}>
                      <input checked={selectedPermissionIds.includes(permission.id)} disabled={!canUpdateRolePermissions || !selectedRoleId} type="checkbox" onChange={() => togglePermission(permission.id)} />
                      <span><strong>{permission.code}</strong><small>{permission.description ?? 'Sin descripcion'}</small></span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}

      <Modal isOpen={isUserModalOpen} title={editingUser ? 'Editar usuario' : 'Nuevo usuario'} description="Asigna un rol para definir sus permisos efectivos." onClose={closeUserModal}>
        <form className="resource-form modal-form" onSubmit={handleUserSubmit}>
          <div className="form-grid">
            <label><span>Usuario</span><input value={userForm.username} onChange={(event) => setUserForm({ ...userForm, username: event.target.value })} required minLength={3} /></label>
            <label><span>Email</span><input type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required /></label>
            <label><span>Nombre</span><input value={userForm.firstName} onChange={(event) => setUserForm({ ...userForm, firstName: event.target.value })} required /></label>
            <label><span>Apellido</span><input value={userForm.lastName} onChange={(event) => setUserForm({ ...userForm, lastName: event.target.value })} required /></label>
            <label><span>Rol</span><select value={userForm.roleId} onChange={(event) => setUserForm({ ...userForm, roleId: event.target.value })} required><option value="">Seleccionar</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
            <label><span>{editingUser ? 'Nueva contrasena' : 'Contrasena'}</span><input minLength={6} type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} required={!editingUser} /></label>
            {editingUser ? <label className="checkbox-field"><input type="checkbox" checked={userForm.isActive} onChange={(event) => setUserForm({ ...userForm, isActive: event.target.checked })} /><span>Activo</span></label> : null}
          </div>
          {userError ? <p className="form-error">{userError}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeUserModal}>Cancelar</button><button className="primary-button" disabled={isSavingUser} type="submit">{isSavingUser ? 'Guardando...' : 'Guardar'}</button></footer>
        </form>
      </Modal>

      <Modal isOpen={isRoleModalOpen} title={editingRole ? 'Editar rol' : 'Nuevo rol'} description="El nombre se normaliza en minusculas. Los permisos se asignan desde la matriz." onClose={closeRoleModal}>
        <form className="resource-form modal-form" onSubmit={handleRoleSubmit}>
          <div className="form-grid"><label className="wide-field"><span>Nombre</span><input value={roleForm.name} onChange={(event) => setRoleForm({ name: event.target.value })} required minLength={2} /></label></div>
          {roleError ? <p className="form-error">{roleError}</p> : null}
          <footer className="modal-actions"><button className="ghost-button" type="button" onClick={closeRoleModal}>Cancelar</button><button className="primary-button" disabled={isSavingRole} type="submit">{isSavingRole ? 'Guardando...' : 'Guardar'}</button></footer>
        </form>
      </Modal>

      <ConfirmDialog confirmLabel="Desactivar" description={`El usuario ${userToDisable?.username ?? ''} quedara inactivo y sus refresh tokens seran revocados.`} isConfirming={isConfirming} isOpen={Boolean(userToDisable)} onCancel={() => setUserToDisable(null)} onConfirm={() => void handleDisableUser()} title="Desactivar usuario" tone="warning" />
      <ConfirmDialog confirmLabel="Eliminar" description={`El rol ${roleToDelete?.name ?? ''} se eliminara solo si no tiene usuarios asignados.`} isConfirming={isConfirming} isOpen={Boolean(roleToDelete)} onCancel={() => setRoleToDelete(null)} onConfirm={() => void handleDeleteRole()} title="Eliminar rol" tone="danger" />
    </section>
  )
}

function groupPermissions(permissions: Permission[]) {
  const groups = new Map<string, Permission[]>()

  permissions.forEach((permission) => {
    const moduleName = permission.code.split(':')[0]
    groups.set(moduleName, [...(groups.get(moduleName) ?? []), permission])
  })

  return Array.from(groups.entries()).map(([module, modulePermissions]) => ({
    module,
    permissions: modulePermissions.sort((first, second) => first.code.localeCompare(second.code)),
  }))
}

function moduleLabel(moduleName: string) {
  return moduleName.replace(/-/g, ' ')
}
