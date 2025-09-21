import React from "react"
export const CtaButton = (props) => {
    return (
        <button onClick={props.onClick} className={` p-2 md:px-4 flex items-center justify-center rounded-[8px] text-[20px] font-semibold leading-4 text-background-color ${props?.className}`}>
            {props.text}
        </button>
    )
}

export const NotificationButton= (props) => {
    return (
        <div className="hidden  w-[40px] h-[40px] md:flex justify-center items-center bg-transparent border border-stroke-style text-stroke-style text-xl rounded-full" onClick={props.onClick}>
            <props.icon className />
        </div>

    )
}