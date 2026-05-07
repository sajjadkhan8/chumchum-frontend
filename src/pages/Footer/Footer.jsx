import { useEffect } from 'react';
import PropTypes from "prop-types";
import { FOOTER_SOCIAL_PLATFORMS, formatSupportedPlatformLabel } from '../../utils/platforms';
import './Footer.scss';

const Footer = ({ hideWidgets = false }) => {

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className='footer'>
      <div className="container">
        {!hideWidgets && (
          <>
            <div className="top">
              <div className="item">
                <h1>Categories</h1>
                <span>Graphic & Design</span>
                <span>Digital Marketing</span>
                <span>Writing & Translation</span>
                <span>Video & Animation</span>
                <span>Music & Audio</span>
                <span>Programming & Tech</span>
                <span>Data</span>
                <span>Business</span>
                <span>Lifestyle</span>
                <span>Photography</span>
                <span>Sitemap</span>
              </div>
              <div className="item">
                <h1>About</h1>
                <span>Careers</span>
                <span>Press & News</span>
                <span>Partnership</span>
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
                <span>Intellectual Property Claims</span>
                <span>Investor Relations</span>
              </div>
              <div className="item">
                <h1>Support</h1>
                <span>Help & Support</span>
                <span>Trust & Safety</span>
                <span>Selling on ChumChum</span>
                <span>Buying on ChumChum</span>
              </div>
              <div className="item">
                <h1>Community</h1>
                <span>Events</span>
                <span>Blog</span>
                <span>Forum</span>
                <span>Community Standards</span>
                <span>Podcast</span>
                <span>Affiliats</span>
                <span>Invite a Friend</span>
              </div>
              <div className="item">
                <h1>More From ChumChum</h1>
                <span>ChumChum Business</span>
                <span>ChumChum Pro</span>
                <span>ChumChum Studios</span>
                <span>ChumChum Logo Maker</span>
                <span>ChumChum Guild</span>
                <span>Get Inspired</span>
                <span>ChumChum Select</span>
                <span>Clear Voice</span>
                <span>ChumChum Workspace</span>
                <span>Learn</span>
                <span>Working Not Working</span>
              </div>
            </div>
            <hr />
          </>
        )}
        <div className="bottom">
          <div className="left">
            <h2>chumchum</h2>
            <span>© ChumChum International Ltd. {new Date().getFullYear()}</span>
          </div>
          <div className="right">
            <div className="social">
              {FOOTER_SOCIAL_PLATFORMS.map((platform) => (
                <span key={platform} className="social-badge">
                  {formatSupportedPlatformLabel(platform)}
                </span>
              ))}
            </div>
            <div className="link">
              <img src="./media/language.png" alt="" />
              <span>English</span>
            </div>
            <div className="link">
              <img src="./media/coin.png" alt="" />
              <span>USD</span>
            </div>
            <div className="link">
              <img src="./media/accessibility.png" alt="" />
              <span>USD</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

Footer.propTypes = {
  hideWidgets: PropTypes.bool,
};

export default Footer