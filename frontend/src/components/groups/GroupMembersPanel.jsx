import { getInitials, getMediaUrl } from '../../utils/media';

export default function GroupMembersPanel({
  group,
  canManageTeam,
  canChangeRole,
  canTransferOwnership,
  openMemberDropdownId,
  setOpenMemberDropdownId,
  onChangeRole,
  onTransferOwnership,
  className = '',
  dropdownDirection = 'down',
}) {
  const dropdownClasses = dropdownDirection === 'up'
    ? 'absolute left-10 bottom-10 w-56 bg-white rounded-golden shadow-halo py-3 z-50 flex flex-col font-bold text-[10px] uppercase tracking-widest text-center border border-gray-100'
    : 'absolute left-10 top-10 w-56 bg-white rounded-golden shadow-halo py-3 z-50 flex flex-col font-bold text-[10px] uppercase tracking-widest text-center border border-gray-100';

  return (
    <div className={className}>
      <h2 className="font-outfit font-black text-xl text-gray-900 mb-1">Members</h2>
      <p className="text-xs font-semibold text-gray-500 mb-6">{group.members?.length || 0} Active Now</p>

      <div className="space-y-4">
        {group.members?.map((member) => (
          <div key={member.id} className="flex items-center justify-between relative group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-golden overflow-hidden bg-gray-200 border-2 border-white shadow-halo flex items-center justify-center text-xs font-bold text-gray-600">
                {member.user?.avatar ? (
                  <img src={getMediaUrl(member.user.avatar)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials(member.user?.name)
                )}
              </div>

              <div>
                <p className="font-bold text-sm text-gray-900 leading-tight">{member.user?.name || 'Utilisateur'}</p>

                <button
                  onClick={() => canManageTeam && (canChangeRole(member) || canTransferOwnership(member)) ? setOpenMemberDropdownId(openMemberDropdownId === member.id ? null : member.id) : null}
                  className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1 mt-0.5 ${canManageTeam ? 'cursor-pointer hover:text-gray-800' : 'cursor-default'}`}
                >
                  {member.role}
                  {canManageTeam && (canChangeRole(member) || canTransferOwnership(member)) && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  )}
                </button>

                {openMemberDropdownId === member.id && (
                  <div className={dropdownClasses}>
                    {canTransferOwnership(member) && (
                      <>
                        <button onClick={() => onTransferOwnership(member.userId)} className="py-2.5 text-gray-700 hover:text-black hover:bg-gray-50 transition cursor-pointer">Transferer la propriete</button>
                        <div className="w-full h-px bg-gray-100 my-1"></div>
                      </>
                    )}
                    {canChangeRole(member) && (
                      <>
                        <button onClick={() => onChangeRole(member.userId, 'EDITOR')} className="py-2.5 text-gray-700 hover:text-black hover:bg-gray-50 transition cursor-pointer">Editor</button>
                        <div className="w-full h-px bg-gray-100 my-1"></div>
                        <button onClick={() => onChangeRole(member.userId, 'MEMBER')} className="py-2.5 text-gray-700 hover:text-black hover:bg-gray-50 transition cursor-pointer">Member</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

