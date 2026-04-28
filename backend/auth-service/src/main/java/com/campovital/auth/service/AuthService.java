package com.campovital.auth.service;

import com.campovital.auth.domain.entity.*;
import com.campovital.auth.domain.enums.RolNombre;
import com.campovital.auth.dto.request.LoginRequest;
import com.campovital.auth.dto.request.RegisterRequest;
import com.campovital.auth.dto.response.AuthResponse;
import com.campovital.auth.exception.BadRequestException;
import com.campovital.auth.exception.ConflictException;
import com.campovital.auth.exception.ResourceNotFoundException;
import com.campovital.auth.repository.*;
import com.campovital.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.stream.Collectors;

/**
 * Servicio de autenticación y registro.
 * Gestiona login con JWT y creación de usuarios con sus perfiles asociados.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;

    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    /**
     * Autentica un usuario y genera un token JWT.
     */
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        String token = jwtTokenProvider.generateToken(authentication);

        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", request.getEmail()));

        return AuthResponse.of(
                token,
                usuario.getId(),
                usuario.getNombreCompleto(),
                usuario.getEmail(),
                usuario.getRoles().stream()
                        .map(r -> r.getNombre().name())
                        .collect(Collectors.toList())
        );
    }

    /**
     * Registra un nuevo usuario con el rol especificado.
     * Si el rol es AGRICULTOR, crea también el perfil de AGRICULTOR.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validar que el email no exista
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("El email ya está registrado: " + request.getEmail());
        }

        // Determinar el rol
        RolNombre rolNombre = determinarRol(request.getRol());
        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseThrow(() -> new ResourceNotFoundException("Rol", "nombre", rolNombre));

        // Crear usuario
        Usuario usuario = Usuario.builder()
                .nombreCompleto(request.getNombreCompleto())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .telefono(request.getTelefono())
                .roles(Collections.singleton(rol))
                .build();
        usuario = usuarioRepository.save(usuario);

        // En microservicios, el perfil específico se crea en su propio servicio o mediante eventos

        // Generar token
        String token = jwtTokenProvider.generateTokenFromEmail(usuario.getEmail());

        return AuthResponse.of(
                token,
                usuario.getId(),
                usuario.getNombreCompleto(),
                usuario.getEmail(),
                usuario.getRoles().stream()
                        .map(r -> r.getNombre().name())
                        .collect(Collectors.toList())
        );
    }

    private RolNombre determinarRol(String rolStr) {
        if (rolStr == null || rolStr.isBlank()) {
            return RolNombre.ROLE_AGRICULTOR; // Rol por defecto
        }
        try {
            String normalizado = rolStr.toUpperCase().startsWith("ROLE_") ? rolStr.toUpperCase() : "ROLE_" + rolStr.toUpperCase();
            return RolNombre.valueOf(normalizado);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Rol inválido: " + rolStr);
        }
    }


}
