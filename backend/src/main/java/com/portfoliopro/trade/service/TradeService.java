package com.portfoliopro.trade.service;

import com.portfoliopro.exception.ResourceNotFoundException;
import com.portfoliopro.trade.dto.OrderDto;
import com.portfoliopro.trade.dto.TransactionDto;
import com.portfoliopro.trade.entity.Order;
import com.portfoliopro.trade.entity.Transaction;
import com.portfoliopro.trade.repository.OrderRepository;
import com.portfoliopro.trade.repository.TransactionRepository;
import com.portfoliopro.user.entity.User;
import com.portfoliopro.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TradeService {

    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersByUserEmail(String email) {
        User user = getUserByEmail(email);
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        return orders.stream().map(order -> OrderDto.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .symbol(order.getStock() != null ? order.getStock().getSymbol() : "UNKNOWN")
                .name(order.getStock() != null ? order.getStock().getName() : "")
                .exchange(order.getStock() != null ? order.getStock().getExchange() : "")
                .side(order.getOrderType() != null ? order.getOrderType().name() : "BUY")
                .orderType(order.getOrderType() != null ? order.getOrderType().name() : "MARKET")
                .orderStatus(order.getOrderStatus() != null ? order.getOrderStatus().name() : "PENDING")
                .quantity(order.getQuantity())
                .executionPrice(order.getExecutionPrice())
                .totalAmount(order.getTotalAmount())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .executedAt(order.getExecutedAt())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionDto> getTransactionsByUserEmail(String email) {
        User user = getUserByEmail(email);
        List<Transaction> transactions = transactionRepository.findByUserIdOrderByTransactionTimeDesc(user.getId());

        return transactions.stream().map(tx -> TransactionDto.builder()
                .id(tx.getId())
                .transactionReference(tx.getTransactionReference())
                .symbol(tx.getSymbol() != null ? tx.getSymbol() : (tx.getStock() != null ? tx.getStock().getSymbol() : ""))
                .name(tx.getStock() != null ? tx.getStock().getName() : "")
                .exchange(tx.getStock() != null ? tx.getStock().getExchange() : "")
                .type(tx.getType() != null ? tx.getType().name() : "")
                .quantity(tx.getQuantity())
                .price(tx.getPrice())
                .amount(tx.getAmount())
                .balanceAfter(tx.getBalanceAfter())
                .description(tx.getDescription())
                .transactionTime(tx.getTransactionTime())
                .build()
        ).collect(Collectors.toList());
    }

    private User getUserByEmail(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + normalizedEmail));
    }
}
