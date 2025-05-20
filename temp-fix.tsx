              {selectedProcesso.tecnicosSelecionados && (
                <div className="mt-2">
                  <span className="font-semibold">Técnicos designados:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {normalizeTecnicosSelecionados(selectedProcesso.tecnicosSelecionados).map((tecnico) => (
                      <Badge key={tecnico.id} variant="outline" className="text-xs">
                        {tecnico.nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
