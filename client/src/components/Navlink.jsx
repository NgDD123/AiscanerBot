import "./pages/on-board.css"
const NavigationLink = (props) => {

    return (
        <div className={`flex gap-x-2 hover:cursor-pointer`} onClick={props.onClick}>
            <div className={`w-[4px] h-5 rounded-[8px] my-auto ${!props.isActive ? 'bg-major-text-style' : 'bg-white'}`} />
            <div className={`w-full flex pl-[6px] py-2 px-4 rounded-[8px] items-center p-[6px] gap-x-[6px] font-bold text-[10px] ${!props.isActive ? 'glass_morphism text-background-color ' : 'text-major-text-style bg-white'}`}>
                <props.icon className={`text-[13.8px] ${props.isActive ? 'text-major-text-style' : 'text-white'}`} />
                <span>{props.name}</span>
            </div>



        </div>
    )

}
export default NavigationLink;