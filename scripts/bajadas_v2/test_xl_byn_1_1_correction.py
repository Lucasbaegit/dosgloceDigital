from xl_byn_1_1_correction import apply_xl_byn_1_1_parenthesis_fix


def test_apply_for_xl_byn_1_1():
    f = "=(AA11+AA48*AN40)*AG48*$AH48"
    r = apply_xl_byn_1_1_parenthesis_fix(f, formato='XL', modo_color='blanco_y_negro', caras='1/1')
    assert r.applied is True
    assert r.formula_corregida == "=(AA11+AA48*AN40*AG48)*$AH48"


def test_keep_a3_unchanged():
    f = "=(AA48*AG48+AD11)*$AH$48"
    r = apply_xl_byn_1_1_parenthesis_fix(f, formato='A3+', modo_color='blanco_y_negro', caras='1/1')
    assert r.applied is False
    assert r.formula_corregida == f


def test_keep_xa3_unchanged():
    f = "=(AA49*AG49+AB11)*$AH$49"
    r = apply_xl_byn_1_1_parenthesis_fix(f, formato='XA3', modo_color='blanco_y_negro', caras='1/1')
    assert r.applied is False
    assert r.formula_corregida == f


def test_keep_a4_unchanged():
    f = "=(AA50*AG50+AD11)*$AH$50"
    r = apply_xl_byn_1_1_parenthesis_fix(f, formato='A4', modo_color='blanco_y_negro', caras='1/1')
    assert r.applied is False
    assert r.formula_corregida == f


def test_keep_xl_color_unchanged():
    f = "=(AA11+AA48*AN40)*AG48*$AH48"
    r = apply_xl_byn_1_1_parenthesis_fix(f, formato='XL', modo_color='fullcolor', caras='1/1')
    assert r.applied is False
    assert r.formula_corregida == f


def test_keep_xl_byn_1_0_unchanged():
    f = "=(AA11+AA48*AN40)*$AH$48"
    r = apply_xl_byn_1_1_parenthesis_fix(f, formato='XL', modo_color='blanco_y_negro', caras='1/0')
    assert r.applied is False
    assert r.formula_corregida == f


if __name__ == '__main__':
    tests = [
        test_apply_for_xl_byn_1_1,
        test_keep_a3_unchanged,
        test_keep_xa3_unchanged,
        test_keep_a4_unchanged,
        test_keep_xl_color_unchanged,
        test_keep_xl_byn_1_0_unchanged,
    ]
    for t in tests:
        t()
    print(f"OK {len(tests)} tests")
