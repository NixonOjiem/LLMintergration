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
                <a href="https://myportfolio-cde82.web.app/">Portfolio</a>
                <a href="https://myportfolio-cde82.web.app/about.html">About me</a>
                <a href="https://myportfolio-cde82.web.app/services.html">Services</a>
                <a href="https://myportfolio-cde82.web.app/project.html">Recent Projects</a>
            </nav>
        </header>
    )
}

export default NavigationBar