package com.portfoliopro.security.jwt;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import com.portfoliopro.config.AppProperties;
import com.portfoliopro.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Date;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final AppProperties appProperties;

    private Algorithm getAlgorithm() {
        return Algorithm.HMAC256(appProperties.getJwt().getSecret());
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + appProperties.getJwt().getExpirationMs());

        return JWT.create()
                .withIssuer(appProperties.getJwt().getIssuer())
                .withSubject(user.getEmail())
                .withClaim("userId", user.getId())
                .withClaim("name", user.getName())
                .withClaim("role", user.getRole().name())
                .withIssuedAt(now)
                .withExpiresAt(expiryDate)
                .sign(getAlgorithm());
    }

    public boolean validateToken(String token) {
        try {
            JWTVerifier verifier = JWT.require(getAlgorithm())
                    .withIssuer(appProperties.getJwt().getIssuer())
                    .build();
            verifier.verify(token);
            return true;
        } catch (JWTVerificationException ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        DecodedJWT decoded = JWT.decode(token);
        return decoded.getSubject();
    }

    public Long getUserIdFromToken(String token) {
        DecodedJWT decoded = JWT.decode(token);
        return decoded.getClaim("userId").asLong();
    }

    public long getExpirationMs() {
        return appProperties.getJwt().getExpirationMs();
    }
}
