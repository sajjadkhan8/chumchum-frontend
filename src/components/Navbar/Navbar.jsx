import Slider from "react-slick";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GrFormNext, GrFormPrevious } from "react-icons/gr";
import { getApiErrorMessage, getCurrentUser, logoutUser } from "../../api";
import { useRecoilState } from "recoil";
import { userState } from "../../atoms";
import { Loader } from "..";
import "./Navbar.scss";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(userState);
  const [isLoading, setIsLoading] = useState(false);

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

  const menuLinks = [
    { path: "/gigs?category=design", name: "Graphics & Design" },
    { path: "/gigs?category=video", name: "Video & Animation" },
    { path: "/gigs?category=books", name: "Writing & Translation" },
    { path: "/gigs?category=ai", name: "AI Services" },
    { path: "/gigs?category=social", name: "Digital Marketing" },
    { path: "/gigs?category=voice", name: "Music & Audio" },
    { path: "/gigs?category=wordpress", name: "Programming & Tech" },
  ];

  const settings = {
    infinite: true,
    slidesToShow: 6,
    slidesToScroll: 2,
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

  return (
    <nav className={showMenu || pathname !== "/" ? "navbar active" : "navbar"}>
      <div className="container">
        <div className="logo">
          <Link to="/" className="link">
            <span className="text">chumchum</span>
          </Link>
          <span className="dot">.</span>
        </div>

        <div className="links">
          <div className="menu-links">
            <span>ChumChum Business</span>
            <span>Explore</span>
            <span>English</span>
            {!user?.isSeller && <span>Become a Seller</span>}
          </div>
          {isLoading ? (
            <Loader size={35} />
          ) : (
            <>
              {!user && (
                <span>
                  <Link to="/login" className="link">
                    Sign in
                  </Link>
                </span>
              )}
              {!user && (
                <button
                  className={showMenu || pathname !== "/" ? "join-active" : ""}
                >
                  <Link to="/register" className="link">
                    Join
                  </Link>
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
                         Dashboard
                       </Link>
                       {user?.role === 'CREATOR' && (
                         <>
                           <Link className="link" to="/my-gigs">
                             My Services
                           </Link>
                           <Link className="link" to="/organize">
                             Add New Service
                           </Link>
                         </>
                       )}
                       {user?.role === 'BRAND' && (
                         <Link className="link" to="/creators">
                           Find Creators
                         </Link>
                       )}
                       <Link className="link" to="/orders">
                         Orders
                       </Link>
                       <Link className="link" to="/messages">
                         Messages
                       </Link>
                       <Link className="link" to="/" onClick={handleLogout}>
                         Logout
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
