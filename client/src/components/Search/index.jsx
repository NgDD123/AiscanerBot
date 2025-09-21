import { useState } from "react";
import { CiSearch } from "react-icons/ci";

const SearchBar = () => {
    const [search, setSearch] = useState("")
    return (
        <div className="bg-transparent border border-stroke-style rounded-[8px] p-2 hidden md:flex items-center relative gap-x-2">
            <CiSearch className="text-white text-xl" />
            <input placeholder="Search Page" value={search} onChange={(e) => setSearch(e.target.value)} className="placeholder:text-xs text-xs bg-transparent outline-none text-white " />
        </div>
    )

}
export default SearchBar;