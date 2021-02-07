import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import '../../assets/scss/landingPage.scoped.scss';

const propTypes = {
  children: PropTypes.node,
  handleClose: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  closeHidden: PropTypes.bool,
  video: PropTypes.string,
  videoTag: PropTypes.oneOf(['iframe', 'video'])
};

const defaultProps = {
  children: null,
  show: false,
  closeHidden: false,
  video: '',
  videoTag: 'iframe'
};

const Modal = ({
  className,
  children,
  handleClose,
  show,
  closeHidden,
  video,
  videoTag,
  onSlideChange,
  ...props
}) => {

  const slideFrameRef = useRef(null) 

  useEffect(() => {
    document.addEventListener('keydown', keyPress);
    document.addEventListener('click', stopProgagation);
    return () => {
      document.removeEventListener('keydown', keyPress);
      document.removeEventListener('click', stopProgagation);
    };
  });

  useEffect(() => {
    handleBodyClass();
  }, [props.show]);

  const handleBodyClass = () => {
    if (document.querySelectorAll('.modal.is-active').length) {
      document.body.classList.add('modal-is-active');
    } else {
      document.body.classList.remove('modal-is-active');
    }
  };

  const keyPress = (e) => {
    e.keyCode === 27 && handleClose(e);
  };

  const stopProgagation = (e) => {
    e.stopPropagation();
  };

  const classes = classNames(
    'modal',
    show && 'is-active',
    video && 'modal-video',
    className
  );

  const getSlideNumber = () => {
    if (slideFrameRef.current && slideFrameRef.current.contentWindow.location.href.includes('#/')) {
        return slideFrameRef.current.contentWindow.location.href.split('#/')[1]
    }
    return '0'
  }

  return (
    <>
      {show &&
        <div
          {...props}
          className={classes}
          onClick={e => handleClose(e, getSlideNumber())}
        >
          <div className="modal-inner" onClick={stopProgagation}>
            {video ?
              <div className="responsive-video">
                {videoTag === 'iframe' ?
                  <>
                    <iframe
                      title="media"
                      src={video}
                      frameBorder="0"
                      allowFullScreen
                      ref={slideFrameRef}
                    />
                    {console.log(">>>>>>>>>>>>>>>>>>>>>", video)}
                  </>
                  :
                  <video
                    v-else
                    controls
                    src={video}
                  ></video>
                }
              </div> :
              <>
                {!closeHidden &&
                  <button
                    className="modal-close"
                    aria-label="close"
                    onClick={e => handleClose(e, getSlideNumber())}
                  ></button>
                }
                <div className="modal-content">
                  {children}
                </div>
              </>
            }
          </div>
        </div>
      }
    </>
  );
};

Modal.propTypes = propTypes;
Modal.defaultProps = defaultProps;

export default Modal;