import React from 'react';
import Image from 'next/image';
import logo from '../assets/logo.jpg';

function NavigationBar() {
    return (
        <header className="header">
            <a href="#" className="companyName">
                LLM Intergration
            </a>
            <Image src={logo} alt="Logo" className="logoIcon" />
            <nav className="navbar">
                <a href="#">Portfolio</a>
                <a href="#">About me</a>
                <a href="#">Services</a>
                <a href="#">Recent Projects</a>
            </nav>
        </header>
    )
}

export default NavigationBar