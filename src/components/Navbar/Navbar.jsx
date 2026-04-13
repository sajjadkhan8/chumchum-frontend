import Slider from "react-slick";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { getApiErrorMessage, getCurrentUser, logoutUser } from "../../api";
import { cards } from "../../data";
import { useRecoilState } from "recoil";
import { userState } from "../../atoms";
import { Loader } from "..";
import "./Navbar.scss";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const translations = {
  en: {
    explore: "Explore",
    english: "English",
    urdu: "Urdu",
    joinAsBrand: "Join as Brand",
    joinAsCreator: "Join as Creator",
    signIn: "Sign in",
    dashboard: "Dashboard",
    myServices: "My Services",
    addNewService: "Add New Service",
    findCreators: "Find Creators",
    orders: "Orders",
    messages: "Messages",
    logout: "Logout",
    categories: {
      design: "Graphics & Design",
      video: "Video & Animation",
      books: "Writing & Translation",
      ai: "AI Services",
      social: "Digital Marketing",
      voice: "Music & Audio",
      wordpress: "Programming & Tech",
    },
  },
  ur: {
    explore: "ایکسپلور",
    english: "انگلش",
    urdu: "اردو",
    joinAsBrand: "برانڈ کے طور پر شامل ہوں",
    joinAsCreator: "کریئیٹر کے طور پر شامل ہوں",
    signIn: "سائن اِن",
    dashboard: "ڈیش بورڈ",
    myServices: "میری سروسز",
    addNewService: "نئی سروس شامل کریں",
    findCreators: "کریئیٹرز تلاش کریں",
    orders: "آرڈرز",
    messages: "میسجز",
    logout: "لاگ آؤٹ",
    categories: {
      design: "گرافکس اور ڈیزائن",
      video: "ویڈیو اور اینیمیشن",
      books: "رائٹنگ اور ٹرانسلیشن",
      ai: "اے آئی سروسز",
      social: "ڈیجیٹل مارکیٹنگ",
      voice: "میوزک اور آڈیو",
      wordpress: "پروگرامنگ اور ٹیک",
    },
  },
};

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [language, setLanguage] = useState(() => {
    const storedLanguage = localStorage.getItem("appLanguage");
    return storedLanguage === "ur" ? "ur" : "en";
  });
  const languageMenuRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(userState);
  const [isLoading, setIsLoading] = useState(false);
  const t = translations[language];

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const data = await getCurrentUser();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem('user');
        console.log(getApiErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const isActive = () => {
    window.scrollY > 0 ? setShowMenu(true) : setShowMenu(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", isActive);
    return () => {
      window.removeEventListener("scroll", isActive);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("appLanguage", language);
    document.documentElement.lang = language === "ur" ? "ur" : "en";
  }, [language]);

  const menuLinks = cards.map((category) => ({
    path: `/packages?category=${category.slug}`,
    name: category.title,
  }));

  const settings = {
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 3,
    prevArrow: <GrFormPrevious />,
    nextArrow: <GrFormNext />,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem('user');
      setUser(null);
      navigate("/");
    } catch (error) {
      console.log(getApiErrorMessage(error));
    }
  };

  const handleLanguageSelect = (nextLanguage) => {
    if (nextLanguage !== "en" && nextLanguage !== "ur") return;
    setLanguage(nextLanguage);
    setShowLanguageMenu(false);
  };

  return (
    <nav className={showMenu || pathname !== "/" ? "navbar active" : "navbar"}>
      <div className="container">
        <div className="logo">
          <Link to="/" className="link">
            <span className="text">ChumChum</span>
          </Link>
          <span className="dot">.</span>
        </div>

        <div className="links">
          <div className="menu-links">
            <span>{t.explore}</span>
            <div className="language-switcher" ref={languageMenuRef}>
              <button
                type="button"
                className="language-toggle"
                onClick={() => setShowLanguageMenu((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={showLanguageMenu}
              >
                {language === "ur" ? "اردو" : "English"}
              </button>
              {showLanguageMenu && (
                <div className="language-menu" role="menu">
                  <button
                    type="button"
                    className={`language-option ${language === "en" ? "active" : ""}`}
                    onClick={() => handleLanguageSelect("en")}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    className={`language-option ${language === "ur" ? "active" : ""}`}
                    onClick={() => handleLanguageSelect("ur")}
                  >
                    اردو
                  </button>
                </div>
              )}
            </div>
            <Link to="/register?role=brand" className="link">
              <span>{t.joinAsBrand}</span>
            </Link>
            {user?.role !== 'CREATOR' && (
              <Link to="/register?role=creator" className="link">
                <span>{t.joinAsCreator}</span>
              </Link>
            )}
          </div>
          {isLoading ? (
            <Loader size={35} />
          ) : (
            <>
              {!user && (
                <button
                  type="button"
                  className={showMenu || pathname !== "/" ? "join-active" : ""}
                  onClick={() => navigate("/login")}
                >
                  {t.signIn}
                </button>
              )}
              {user && (
                <button
                  className="user"
                  onClick={() => setShowPanel(!showPanel)}
                  aria-label="Toggle user menu"
                >
                  <img src={user.image || "/media/noavatar.png"} alt={user?.username} />
                  <span>{user?.username}</span>
                   {showPanel && (
                     <div className="options">
                       <Link className="link" to="/dashboard">
                          {t.dashboard}
                       </Link>
                       {user?.role === 'CREATOR' && (
                         <>
                            <Link className="link" to="/my-packages">
                              {t.myServices}
                           </Link>
                            <Link className="link" to="/packages/new">
                              {t.addNewService}
                           </Link>
                         </>
                       )}
                       {user?.role === 'BRAND' && (
                         <Link className="link" to="/creators">
                            {t.findCreators}
                         </Link>
                       )}
                       <Link className="link" to="/orders">
                          {t.orders}
                       </Link>
                       <Link className="link" to="/messages">
                          {t.messages}
                       </Link>
                       <Link className="link" to="/" onClick={handleLogout}>
                          {t.logout}
                       </Link>
                     </div>
                   )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {(showMenu || pathname !== "/") && (
        <>
          <hr />
          <Slider className="menu" {...settings}>
            {menuLinks.map(({ path, name }) => (
              <div key={name} className="menu-item">
                <Link className="link" to={path}>
                  {name}
                </Link>
              </div>
            ))}
          </Slider>
        </>
      )}
    </nav>
  );
};

export default Navbar;
