import { CtaButton } from "../Button";
import Logo from "../Logo";
import '../pages/on-board.css'
const AuthNavbar = (props) => {
    
    return (
        <section className="glass_morphism w-[97%] mx-auto p-3 fixed z-20">
            <div className="flex w-full justify-between items-center">
                <div className="basis-1/2 flex justify-between items-center">
                    <Logo />
                </div>
                <div className="md:basis-1/2 flex items-center justify-end">
                    <CtaButton text={props.action} isAuth={false} onClick={props.onClick} className={"leading-6 font-bold py-[10px] bg-major-text-style"} />
                </div>

            </div>


        </section>
    )

}
export default AuthNavbar;