## ADDED Requirements

### Requirement: CSP prevents iframe embedding

The system SHALL include `frame-ancestors 'none'` in the Content-Security-Policy meta tag of `index.html`. This SHALL prevent the app from being rendered inside an iframe on any origin.

#### Scenario: App loaded in iframe
- **WHEN** a third-party site embeds illo3d in an iframe
- **THEN** the browser refuses to render the app due to CSP frame-ancestors

### Requirement: Referrer-Policy meta tag is present

The system SHALL include a `<meta name="referrer" content="strict-origin-when-cross-origin" />` tag in `index.html`. This SHALL limit referrer information sent to cross-origin requests to the origin only.

#### Scenario: Cross-origin navigation
- **WHEN** the user clicks an external link from the app
- **THEN** the referrer sent to the external site contains only the origin, not the full path

### Requirement: X-Content-Type-Options meta tag is present

The system SHALL include `<meta http-equiv="X-Content-Type-Options" content="nosniff" />` in `index.html`. This SHALL instruct the browser not to MIME-sniff responses away from the declared content type.

#### Scenario: Script loaded with wrong content-type
- **WHEN** a script is served with a non-JavaScript content type
- **THEN** the browser does not execute it

### Requirement: Permissions-Policy meta tag is present

The system SHALL include `<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />` in `index.html`. This SHALL disable access to camera, microphone, and geolocation APIs.

#### Scenario: Page requests camera permission
- **WHEN** JavaScript attempts to access camera, microphone, or geolocation
- **THEN** the browser denies the request
