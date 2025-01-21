// src/components/GoogleAnalytics.js
import React from 'react';
import { Helmet } from 'react-helmet';

const GoogleAnalytics = () => (
    <Helmet>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-5VEDN0823V"></script>
        <script>
            {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', 'G-5VEDN0823V');
      `}
        </script>
    </Helmet>
);

export default GoogleAnalytics;
