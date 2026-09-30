package com.portfoliopro.security.oauth2;

import com.portfoliopro.auth.service.AuthService;
import com.portfoliopro.config.AppProperties;
import com.portfoliopro.security.jwt.JwtTokenProvider;
import com.portfoliopro.user.entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

import org.springframework.context.annotation.Lazy;

/**
 * Handles successful Google OAuth authentication, extracts verified OIDC claims,
 * persists or links the user identity in MariaDB, and securely redirects to the React frontend
 * with PortfolioPro's internal JWT token.
 */
@Slf4j
@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final AppProperties appProperties;
    private final HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository;

    public OAuth2AuthenticationSuccessHandler(@Lazy AuthService authService,
                                              JwtTokenProvider jwtTokenProvider,
                                              AppProperties appProperties,
                                              HttpCookieOAuth2AuthorizationRequestRepository httpCookieOAuth2AuthorizationRequestRepository) {
        this.authService = authService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.appProperties = appProperties;
        this.httpCookieOAuth2AuthorizationRequestRepository = httpCookieOAuth2AuthorizationRequestRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        String targetUrl = determineTargetUrl(request, response, authentication);

        if (response.isCommitted()) {
            log.debug("Response has already been committed. Unable to redirect to " + targetUrl);
            return;
        }

        clearAuthenticationAttributes(request, response);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    @Override
    protected String determineTargetUrl(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

        String googleSub;
        if (oauth2User instanceof OidcUser oidcUser) {
            googleSub = oidcUser.getSubject();
        } else {
            googleSub = oauth2User.getAttribute("sub");
        }

        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");

        User user = authService.processGoogleOAuthUser(googleSub, email, name, picture);
        String jwtToken = jwtTokenProvider.generateToken(user);

        String frontendRedirectUrl = appProperties.getMail().getFrontendUrl() + "/login";

        return UriComponentsBuilder.fromUriString(frontendRedirectUrl)
                .queryParam("oauth_token", jwtToken)
                .build().toUriString();
    }

    protected void clearAuthenticationAttributes(HttpServletRequest request, HttpServletResponse response) {
        super.clearAuthenticationAttributes(request);
        httpCookieOAuth2AuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);
    }
}
