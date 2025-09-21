
const ProfileCard = (props) => {
    return (
        <div className="flex flex-col gap-y-[2px]">
            <p className="font-bold text-[12px] text-white">{props.username}</p>
            <p className="text-[12px] font-bold text-white">{props.email}</p>
        </div>
    )

}
export default ProfileCard;