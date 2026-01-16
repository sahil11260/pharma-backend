package com.kavyapharm.farmatrack.product.service;

import com.kavyapharm.farmatrack.product.dto.CreateProductRequest;
import com.kavyapharm.farmatrack.product.dto.ProductResponse;
import com.kavyapharm.farmatrack.product.dto.UpdateProductRequest;
import com.kavyapharm.farmatrack.product.model.Product;
import com.kavyapharm.farmatrack.product.repository.ProductRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<ProductResponse> list() {
        return productRepository.findAll(Sort.by(Sort.Direction.DESC, "id"))
                .stream().map(ProductService::toResponse).toList();
    }

    public ProductResponse get(Long id) {
        Objects.requireNonNull(id, "id is required");
        return toResponse(getEntity(id));
    }

    public ProductResponse create(CreateProductRequest request) {
        Product product = new Product();
        product.setName(request.name());
        product.setCategory(request.category());
        product.setPrice(request.price());
        product.setStock(request.stock());

        return toResponse(productRepository.save(product));
    }

    public ProductResponse update(Long id, UpdateProductRequest request) {
        Objects.requireNonNull(id, "id is required");
        Product product = getEntity(id);

        product.setName(request.name());
        product.setCategory(request.category());
        product.setPrice(request.price());
        product.setStock(request.stock());

        return toResponse(productRepository.save(product));
    }

    public void delete(Long id) {
        Objects.requireNonNull(id, "id is required");
        if (!productRepository.existsById(id)) {
            return;
        }
        productRepository.deleteById(id);
    }

    private Product getEntity(Long id) {
        Objects.requireNonNull(id, "id is required");
        return productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    }

    public static ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getPrice(),
                product.getStock()
        );
    }
}
