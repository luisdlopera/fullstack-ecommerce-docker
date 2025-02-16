'use client';

import { useEffect, useState } from "react";
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenuToggle,
    NavbarMenu,
    NavbarMenuItem,
    Link,
    Button,
} from "@heroui/react";
import { Heart, Search, ShoppingCart, User } from "lucide-react";


export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuItems = [
        "Inicio",
        "Nuevo",
        "Hombre",
        "Mujer",
        "Niños"
    ];
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 648) { 
                setScrolled(true);
            } else {
                setScrolled(false);
            }
            // console.log("Scroll Y:", window.scrollY);
        };

        window.addEventListener("scroll", handleScroll);

        // console.log("Initial Scroll Y:", window.scrollY);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 z-20 w-full h-[84px] mx-auto transition-all flex items-center justify-center
            ${scrolled ? "bg-white/40 backdrop-blur-md text-black" : "bg-transparent text-white"}`}>
            <div className="mx-auto w-[90%] flex justify-between items-center" >

                <div className="" >
                    {/* <NavbarMenuToggle
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        className="sm:hidden"
                    /> */}
                    <div>
                        <p className="font-bold text-inherit text-2xl">NEXSTORE</p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center justify-center gap-20">
                    {menuItems.map((item, index) => {
                        const itemToUrlMap: { [key: string]: string } = {
                            "Inicio": "",
                            "Nuevo": "new",
                            "Hombre": "men",
                            "Mujer": "women",
                            "Niños": "kids"
                        };
                        const url = itemToUrlMap[item];
                        const isActive = window.location.pathname === `/${url}`;
                        return (
                            <div key={index}>
                                <Link
                                    color="foreground"
                                    href={`/${url}`}
                                    className={`${scrolled ? "text-black" : "text-white"} ${isActive ? "bg-primary text-white font-bold px-5 py-2 rounded-xl" : ""}`}
                                >
                                    {item}
                                </Link>
                            </div>
                        );
                    })}
                </div>

                <div className="flex gap-4" >
                    <div className="hidden lg:flex">
                        <Button as={Link} isIconOnly aria-label="Like" color="default">
                            <Search />
                        </Button>
                    </div>
                    <div className="hidden lg:flex">
                        <Button as={Link} isIconOnly aria-label="Like" color="default">
                            <Heart />
                        </Button>
                    </div>
                    <div className="hidden lg:flex">
                        <Button as={Link} isIconOnly aria-label="Like" color="default">
                            <ShoppingCart />
                        </Button>
                    </div>
                    <div className="hidden lg:flex">
                        <Button as={Link} aria-label="Like" color="default" className="flex items-center gap-2 font-bold">
                            <User />
                            Iniciar sesión
                        </Button>
                    </div>
                </div>
            </div>

            {/* <div>
                {menuItems.map((item, index) => (
                    <NavbarMenuItem key={`${item}-${index}`}>
                        <Link
                            className="w-full"
                            color={
                                index === 2 ? "primary" : index === menuItems.length - 1 ? "danger" : "foreground"
                            }
                            href="#"
                            size="lg"
                        >
                            {item}
                        </Link>
                    </NavbarMenuItem>
                ))}
            </div> */}
        </header>
    );
}

